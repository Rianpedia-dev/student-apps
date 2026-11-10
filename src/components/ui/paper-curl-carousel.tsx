"use client";

import * as React from "react";

/**
 * Paper Curl Carousel — every slide is a printed sheet. Drag its edge, click,
 * or press an arrow, and the sheet rolls over a cylinder, shows the paper
 * stock on its back, and lays a shadow on the sheet underneath.
 *
 * One fragment-shader pass over two textures, no mesh. Raw WebGL, React is the only import.
 */

export type PaperCurlItem = {
  /** Image URL. Must be CORS-enabled, same-origin or a data: URL to be curled. */
  src: string;
  title?: string;
  caption?: string;
  alt?: string;
};

export type PaperCurlCarouselProps = {
  items: PaperCurlItem[];
  /** Total height, caption rail included. **Must be a definite length.** */
  height?: string;
  /** Milliseconds between automatic turns. 0 (default) is off. */
  autoplay?: number;
  /** Wrap past the ends. */
  loop?: boolean;
  /** The paper stock on the back of each sheet, as #rrggbb. */
  paper?: string;
  /** The caption rail under the stage: counter, title, caption, controls. */
  rail?: boolean;
  /** Controlled index. Omit for uncontrolled. */
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  className?: string;
};

type Vec = [number, number];
type Ends = { rest: number; gone: number; mid: number; lo: number };

// #region curl
/** Curl radius, in stage heights. */
export const RADIUS = 0.09;
/** Pointer speed (px/ms) past which a release is a flick and decides the turn on its own. */
export const FLICK = 0.11;

export function wrapIndex(i: number, n: number, loop: boolean): number {
  if (n <= 0) return 0;
  return loop ? ((i % n) + n) % n : Math.min(Math.max(i, 0), n - 1);
}

/** Unit fold direction in page space (y up). Negative tilt lifts the bottom corner first. */
export function foldDir(tilt: number): Vec {
  const l = Math.hypot(1, tilt);
  return [1 / l, tilt / l];
}

/**
 * Fold positions along `dir` for a page [0, aspect] x [0, 1]: at rest nothing
 * is lifted; once gone, the roll and its shadow are past the far edge.
 */
export function foldEnds(dir: Vec, aspect: number, r: number): Ends {
  const ds = [0, aspect * dir[0], dir[1], aspect * dir[0] + dir[1]];
  const lo = Math.min(...ds);
  const hi = Math.max(...ds);
  return { rest: hi + 0.001, gone: lo - r * 1.6, mid: (lo + hi) / 2, lo };
}

/**
 * Fold position after a next-turn drag of `travel` stage heights. At first
 * the corner curls up in place, so the fold keeps pace with the finger. Once
 * half a turn of paper is on the roll the flipped corner rides under the
 * finger instead, and that needs the fold at half the finger's speed.
 */
export function dragFoldNext(rest: number, travel: number, r: number): number {
  const t = Math.max(travel, 0);
  const knee = Math.PI * r;
  return t < knee ? rest - t : rest - t / 2 - knee / 2;
}

/** Inverse of dragFoldNext: how far a finger must have travelled to hold the fold here. */
export function travelForFoldNext(rest: number, fold: number, r: number): number {
  const k = Math.max(rest - fold, 0);
  const knee = Math.PI * r;
  return k < knee ? k : 2 * k - knee;
}

/** A flick decides by its direction; anything slower decides by distance. */
export function shouldCommit(travelled: number, halfway: number, velocity: number): boolean {
  if (Math.abs(velocity) > FLICK) return velocity > 0;
  return travelled > halfway;
}

/** How much of the roll's shadow to draw: none until the roll is on the page. */
export function shadeFor(fold: number, lo: number, r: number): number {
  return Math.min(Math.max((fold + r - lo) / (r * 0.6), 0), 1);
}

/** Spring stiffness for a turn: about 0.8s edge to edge. */
export const OMEGA_TURN = 4.5;
/**
 * A spring only approaches its target, so a turn aimed exactly at the edge
 * spends its last second creeping the final corner off-stage. Aiming past the
 * edge and stopping at it means the sheet arrives moving and is done. Leaving
 * pushes harder than landing: an exit should be quicker than an entrance.
 */
export const EXIT_PUSH = 0.3;
export const LAND_PUSH = 0.2;

/** One semi-implicit Euler step of a critically damped spring. */
export function springStep(x: number, v: number, target: number, omega: number, dt: number): Vec {
  const a = -omega * omega * (x - target) - 2 * omega * v;
  const nv = v + a * dt;
  return [x + nv * dt, nv];
}
// #endregion

/** Clicks, keys and autoplay lift the bottom-right corner first, like a book. */
const DEFAULT_TILT = -0.4;
/** How far a hover lifts the corner, and how far the previous sheet's roll peeks in. */
const PEEK_NEXT = 0.22;
const PEEK_PREV = 0.07;
/** A peek answers the pointer fast. */
const OMEGA_PEEK = 16;

const VERT = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;

uniform sampler2D u_from;
uniform sampler2D u_to;
uniform vec2 u_res;
uniform float u_fromAspect;
uniform float u_toAspect;
uniform vec2 u_dir;
uniform float u_fold;
uniform float u_r;
uniform float u_shade;
uniform float u_turning;
uniform vec3 u_paper;

varying vec2 v_uv;

const float PI = 3.14159265;
const vec2 LIGHT = vec2(0.33, 0.944);

float stageAspect() { return u_res.x / u_res.y; }

vec3 sampleCover(sampler2D tex, float imgAspect, vec2 P) {
  float a = stageAspect();
  vec2 uv = vec2(P.x / a, P.y);
  vec2 s = a > imgAspect ? vec2(1.0, imgAspect / a) : vec2(a / imgAspect, 1.0);
  return texture2D(tex, (uv - 0.5) * s + 0.5).rgb;
}

float sdPage(vec2 P) {
  vec2 h = vec2(stageAspect(), 1.0) * 0.5;
  vec2 q = abs(P - h) - h;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
}

float onSheet(vec2 P, float aa) { return clamp(0.5 - sdPage(P) / aa, 0.0, 1.0); }

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float backLight(float theta) {
  vec2 n = vec2(sin(theta), -cos(theta));
  float diff = dot(n, LIGHT);
  return 0.64 + 0.34 * clamp(diff, 0.0, 1.0) + pow(max(diff, 0.0), 14.0) * 0.07;
}

vec3 paperBack(vec2 P, float light) {
  vec3 ink = sampleCover(u_from, u_fromAspect, P);
  float lum = dot(ink, vec3(0.299, 0.587, 0.114));
  vec3 c = u_paper * mix(1.0, 0.72 + 0.28 * lum, 0.35);
  float tooth = hash(floor(P * u_res.y * 0.7)) - 0.5;
  float fibre = hash(vec2(floor(P.x * 9.0), floor(P.y * u_res.y * 0.25))) - 0.5;
  return (c + tooth * 0.03 + fibre * 0.012) * light;
}

void main() {
  vec2 p = vec2(v_uv.x * stageAspect(), v_uv.y);
  float aa = 1.2 / u_res.y;
  float grain = (hash(floor(v_uv * u_res)) - 0.5) * 0.024;

  if (u_turning < 0.5) {
    gl_FragColor = vec4(sampleCover(u_from, u_fromAspect, p) + grain, 1.0);
    return;
  }

  float d = dot(p, u_dir);
  float f = u_fold;
  float R = u_r;

  vec3 col = sampleCover(u_to, u_toAspect, p) + grain;
  vec2 rollTop = p + u_dir * (f + R * PI * 0.5 - d);
  float along = 1.0 - smoothstep(0.0, R * 0.8, sdPage(rollTop));
  float beyond = max(d - f - R, 0.0);
  col *= 1.0 - 0.42 * u_shade * along * exp(-beyond / (R * 0.8)) * step(f, d);

  vec2 laid = p + u_dir * (2.0 * f + PI * R - 2.0 * d);
  if (d < f) {
    float occl = 0.3 * exp(-max(sdPage(laid), 0.0) / (R * 0.28));
    float gutter = 0.1 * exp(-(f - d) / (R * 0.4));
    col = (sampleCover(u_from, u_fromAspect, p) + grain) * (1.0 - occl - gutter);
  }

  float inRoll = step(f, d) * (1.0 - smoothstep(f + R - aa, f + R, d));
  if (inRoll > 0.0) {
    float a = asin(clamp((d - f) / R, 0.0, 1.0));

    vec2 under = p + u_dir * (f + R * a - d);
    float lightIn = 0.42 + 0.6 * clamp(dot(vec2(-sin(a), cos(a)), LIGHT), 0.0, 1.0);
    col = mix(col, (sampleCover(u_from, u_fromAspect, under) + grain) * lightIn, onSheet(under, aa) * inRoll);

    float theta = PI - a;
    vec2 over = p + u_dir * (f + R * theta - d);
    col = mix(col, paperBack(over, backLight(theta)), onSheet(over, aa) * inRoll);
  }

  if (d < f) {
    col = mix(col, paperBack(laid, backLight(PI)), onSheet(laid, aa));
  }

  gl_FragColor = vec4(col, 1.0);
}
`;

const compile = (gl: WebGLRenderingContext, type: number, src: string) => {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("could not create shader");
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error("shader compile failed: " + log);
  }
  return shader;
};

const link = (gl: WebGLRenderingContext) => {
  const vert = compile(gl, gl.VERTEX_SHADER, VERT);
  const frag = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  const program = gl.createProgram();
  if (!program) throw new Error("could not create program");
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  gl.deleteShader(vert);
  gl.deleteShader(frag);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error("program link failed: " + log);
  }
  return program;
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("could not load " + src));
    img.src = src;
  });

const hexToRgb = (hex: string): [number, number, number] => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  const v = parseInt(m ? m[1] : "EDEEE9", 16);
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
};

const pad = (i: number) => String(i).padStart(2, "0");

const CSS =
  ".pcc-root{position:relative;display:flex;flex-direction:column;width:100%;overflow:hidden;" +
  "background:var(--color-card,#FFFFFF);color:var(--color-card-foreground,#111111);border-radius:1.25rem;border:1px solid var(--color-border,#E2E8F0);box-shadow:0 10px 25px -5px rgba(0,0,0,0.07)}" +
  ".pcc-stage{position:relative;flex:1 1 auto;min-height:0;overflow:hidden;cursor:grab;touch-action:pan-y;" +
  "user-select:none;-webkit-user-select:none;outline:none;border-radius:1.25rem}" +
  ".pcc-stage[data-holding='true']{cursor:grabbing}" +
  ".pcc-stage:focus-visible{box-shadow:inset 0 0 0 2px var(--color-primary,#111111)}" +
  ".pcc-canvas,.pcc-fallback{position:absolute;inset:0;display:block;width:100%;height:100%;max-width:none}" +
  ".pcc-canvas{transition:opacity 400ms ease}" +
  ".pcc-fallback{object-fit:cover}" +
  ".pcc-rail{display:flex;align-items:center;justify-content:space-between;gap:12px;height:58px;flex-shrink:0;" +
  "padding:0 14px 0 16px;border-top:1px solid var(--color-border,#E2E8F0);background:var(--color-background,#FAFAF9)}" +
  ".pcc-caption{display:flex;align-items:center;gap:12px;min-width:0;font-size:14px;line-height:18px}" +
  ".pcc-caption>*{animation:pcc-in 260ms cubic-bezier(0.23,1,0.32,1) both}" +
  ".pcc-count{flex-shrink:0;font-size:12px;font-weight:700;letter-spacing:.04em;font-variant-numeric:tabular-nums;" +
  "color:var(--color-muted-foreground,#767676);background:var(--color-muted,rgba(0,0,0,0.05));padding:2px 8px;border-radius:9999px}" +
  ".pcc-count b{font-weight:800;color:var(--color-foreground,#047857)}" +
  ".pcc-title{flex-shrink:0;font-weight:700;font-size:13px;color:var(--color-foreground,#111111)}" +
  ".pcc-sub{min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-size:12px;" +
  "color:var(--color-muted-foreground,#6B6B6B)}" +
  ".pcc-controls{display:flex;gap:6px;flex-shrink:0}" +
  ".pcc-btn{position:relative;display:flex;align-items:center;justify-content:center;width:34px;height:34px;" +
  "padding:0;border-radius:50%;border:1px solid var(--color-border,#D4D4D4);background:var(--color-card,#FFFFFF);color:inherit;" +
  "cursor:pointer;transition:transform 160ms ease-out,border-color 200ms ease,background-color 200ms ease}" +
  ".pcc-btn:active{transform:scale(0.95)}" +
  ".pcc-btn:disabled{opacity:.35;cursor:default}" +
  ".pcc-btn:focus-visible{outline:2px solid var(--color-primary,#111111);outline-offset:2px}" +
  "@media (hover:hover) and (pointer:fine){.pcc-btn:hover:not(:disabled){border-color:var(--color-primary,#047857);color:var(--color-primary,#047857)}}" +
  ".pcc-ring{position:absolute;inset:-1px;width:34px;height:34px;pointer-events:none;transform:rotate(-90deg)}" +
  ".pcc-ring circle{fill:none;stroke:currentColor;stroke-width:1.75;stroke-dasharray:100;stroke-dashoffset:100;" +
  "animation:pcc-ring linear forwards}" +
  ".pcc-clock{position:absolute;width:0;height:0;animation:pcc-clock linear forwards}" +
  ".pcc-root[data-paused='true'] .pcc-ring circle,.pcc-root[data-paused='true'] .pcc-clock{animation-play-state:paused}" +
  ".pcc-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);" +
  "white-space:nowrap;border:0}" +
  "@keyframes pcc-in{from{opacity:0;transform:translateY(4px)}}" +
  "@keyframes pcc-fade{from{opacity:0}}" +
  "@keyframes pcc-ring{to{stroke-dashoffset:0}}" +
  "@keyframes pcc-clock{from{opacity:0}to{opacity:0}}" +
  "@media (prefers-reduced-motion:reduce){.pcc-caption>*{animation-name:pcc-fade}}" +
  "@media (max-width:560px){.pcc-sub{display:none}.pcc-rail{padding:0 10px 0 12px}}";

type Turn = {
  kind: 1 | -1;
  from: number;
  to: number;
  dir: Vec;
  ends: Ends;
  fold: number;
  v: number;
  target: number;
  omega: number;
  peek: boolean;
  dragging: boolean;
};

type Drag = {
  id: number;
  x0: number;
  y0: number;
  lastX: number;
  lastY: number;
  lastT: number;
  h: number;
  grab: number;
  vel: number;
  moved: boolean;
};

export default function zPaperCurlCarousel({
  items,
  height = "350px",
  autoplay = 0,
  loop = true,
  paper = "#F7F5EE",
  rail = true,
  index,
  defaultIndex = 0,
  onIndexChange,
  className = "",
}: PaperCurlCarouselProps) {
  const n = items.length;
  const rootRef = React.useRef<HTMLElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  const [uncontrolled, setUncontrolled] = React.useState(() => wrapIndex(defaultIndex, n, loop));
  const active = index === undefined ? wrapIndex(uncontrolled, n, loop) : wrapIndex(index, n, loop);

  const [failed, setFailed] = React.useState(false);
  const [ready, setReady] = React.useState(false);
  const [generation, setGeneration] = React.useState(0);
  const [reduced, setReduced] = React.useState(false);
  const [hoverable, setHoverable] = React.useState(false);
  const [hidden, setHidden] = React.useState(false);
  const [inView, setInView] = React.useState(true);
  const [focused, setFocused] = React.useState(false);
  const [holding, setHolding] = React.useState(false);
  const [zone, setZone] = React.useState<0 | 1 | -1>(0);
  const [overRail, setOverRail] = React.useState(false);
  const [stopped, setStopped] = React.useState(false);

  React.useEffect(() => {
    const bind = (q: string, set: (v: boolean) => void) => {
      const mq = window.matchMedia(q);
      set(mq.matches);
      const h = (e: MediaQueryListEvent) => set(e.matches);
      mq.addEventListener("change", h);
      return () => mq.removeEventListener("change", h);
    };
    const offMotion = bind("(prefers-reduced-motion: reduce)", setReduced);
    const offHover = bind("(hover: hover) and (pointer: fine)", setHoverable);
    const onVisibility = () => setHidden(document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      offMotion();
      offHover();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  React.useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const go = React.useCallback(
    (next: number) => {
      const w = wrapIndex(next, n, loop);
      if (index === undefined) setUncontrolled(w);
      onIndexChange?.(w);
    },
    [index, n, loop, onIndexChange],
  );

  // mutable engine state
  const live = React.useRef({ reduced, loop, n, paper });
  live.current = { reduced, loop, n, paper };
  const engineRef = React.useRef({
    cur: active,
    turn: null as Turn | null,
    aspect: 1.66,
    kick: () => {},
  });
  const E = engineRef.current;

  const makeTurn = (kind: 1 | -1, tilt: number, from: number, to: number, peek: boolean): Turn => {
    const dir = foldDir(tilt);
    const ends = foldEnds(dir, E.aspect, RADIUS);
    const fold = kind === 1 ? ends.rest : ends.gone;
    return { kind, from, to, dir, ends, fold, v: 0, target: fold, omega: peek ? OMEGA_PEEK : OMEGA_TURN, peek, dragging: false };
  };
  const startEnd = (t: Turn) => (t.kind === 1 ? t.ends.rest : t.ends.gone);
  const commitEnd = (t: Turn) => (t.kind === 1 ? t.ends.gone : t.ends.rest);
  const landsOn = (t: Turn) => (t.kind === 1 ? t.to : t.from);

  const resolve = (t: Turn, end: number) => {
    E.cur = end === t.ends.gone ? t.to : t.from;
    E.turn = null;
  };
  const finishNow = () => {
    const t = E.turn;
    if (!t) return;
    resolve(t, t.target === t.ends.gone || t.target === t.ends.rest ? t.target : startEnd(t));
  };

  const previous = React.useRef(active);
  const commitTo = (dest: number) => {
    previous.current = dest;
    go(dest);
  };

  React.useEffect(() => {
    if (previous.current === active) return;
    previous.current = active;
    const t = E.turn;
    if (t && landsOn(t) === active) {
      t.peek = false;
      t.dragging = false;
      t.omega = OMEGA_TURN;
      t.target = commitEnd(t);
      if (live.current.reduced) resolve(t, t.target);
      E.kick();
      return;
    }
    finishNow();
    if (active !== E.cur) {
      if (live.current.reduced) {
        E.cur = active;
      } else {
        const { n: count, loop: wraps } = live.current;
        const forward = wraps ? ((active - E.cur + count) % count) * 2 <= count : active > E.cur;
        const next = forward
          ? makeTurn(1, DEFAULT_TILT, E.cur, active, false)
          : makeTurn(-1, DEFAULT_TILT, active, E.cur, false);
        next.target = commitEnd(next);
        E.turn = next;
      }
    }
    E.kick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const sources = items.map((i) => i.src).join("\n");

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || n === 0) return;
    const gl =
      canvas.getContext("webgl", { alpha: false, antialias: false }) ??
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) {
      setFailed(true);
      return;
    }

    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;
    const textures: (WebGLTexture | null)[] = items.map(() => null);
    const aspects: number[] = items.map(() => 1);
    const U: Record<string, WebGLUniformLocation | null> = {};
    let raf = 0;
    let last = 0;
    let disposed = false;
    let started = false;

    const onLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const onRestored = () => setGeneration((g) => g + 1);
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);

    const pick = (i: number) => textures[i] ?? textures.find((t) => t) ?? null;

    const draw = () => {
      if (disposed || !started) return;
      const t = E.turn;
      const fromIdx = t ? t.from : E.cur;
      const toIdx = t ? t.to : E.cur;
      const fromTex = pick(fromIdx);
      const toTex = pick(toIdx);
      if (!fromTex || !toTex) return;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fromTex);
      gl.uniform1i(U.from, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, toTex);
      gl.uniform1i(U.to, 1);
      gl.uniform2f(U.res, canvas.width, canvas.height);
      gl.uniform1f(U.fromAspect, aspects[fromIdx] ?? 1);
      gl.uniform1f(U.toAspect, aspects[toIdx] ?? 1);
      gl.uniform3fv(U.paper, hexToRgb(live.current.paper));
      gl.uniform1f(U.turning, t ? 1 : 0);
      if (t) {
        gl.uniform2f(U.dir, t.dir[0], t.dir[1]);
        gl.uniform1f(U.fold, t.fold);
        gl.uniform1f(U.r, RADIUS);
        gl.uniform1f(U.shade, shadeFor(t.fold, t.ends.lo, RADIUS));
      }
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const atEnd = (t: Turn) => t.target === t.ends.gone || t.target === t.ends.rest;
    const isMoving = (t: Turn | null) =>
      !!t && !t.dragging && (atEnd(t) || Math.abs(t.fold - t.target) > 0.0015 || Math.abs(t.v) > 0.02);

    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min((now - last) / 1000, 1 / 20);
      last = now;
      const t = E.turn;
      if (t && !t.dragging) {
        const end = atEnd(t);
        const aim = !end ? t.target : t.target === t.ends.gone ? t.target - EXIT_PUSH : t.target + LAND_PUSH;
        const [x, v] = springStep(t.fold, t.v, aim, t.omega, dt);
        t.fold = Math.min(Math.max(x, t.ends.gone), t.ends.rest);
        t.v = t.fold === x ? v : 0;
        if (end && t.fold === t.target) resolve(t, t.target);
        else if (!end && !isMoving(t)) {
          t.fold = t.target;
          t.v = 0;
        }
      }
      draw();
      if (isMoving(E.turn)) raf = requestAnimationFrame(frame);
    };

    E.kick = () => {
      if (raf || disposed) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(canvas.clientWidth * dpr);
      const h = Math.round(canvas.clientHeight * dpr);
      if (w === 0 || h === 0) return;
      E.aspect = w / h;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      draw();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    try {
      program = link(gl);
      gl.useProgram(program);
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(program, "a_position");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      for (const name of ["from", "to", "res", "fromAspect", "toAspect", "dir", "fold", "r", "shade", "turning", "paper"]) {
        U[name] = gl.getUniformLocation(program, "u_" + name);
      }
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    } catch {
      setFailed(true);
      return;
    }

    let refused = 0;
    items.forEach((item, i) => {
      loadImage(item.src).then(
        (img) => {
          if (disposed) return;
          const tex = gl.createTexture();
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          textures[i] = tex;
          aspects[i] = img.naturalWidth / Math.max(img.naturalHeight, 1);
          if (!started) {
            started = true;
            setReady(true);
            resize();
          } else {
            draw();
          }
        },
        () => {
          refused += 1;
          if (refused === items.length && !disposed) setFailed(true);
        },
      );
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      E.kick = () => {};
      observer.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      for (const tex of textures) if (tex) gl.deleteTexture(tex);
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sources, generation, n]);

  React.useEffect(() => E.kick(), [paper, E]);

  // pointer handling
  const drag = React.useRef<Drag | null>(null);
  const canTurn = (kind: 1 | -1) => n > 1 && (loop || (kind === 1 ? E.cur < n - 1 : E.cur > 0));
  const tiltAt = (clientY: number, r: DOMRect) => (0.5 - (clientY - r.top) / r.height) * 0.9;
  const sheets = (kind: 1 | -1): [number, number] =>
    kind === 1 ? [E.cur, wrapIndex(E.cur + 1, n, loop)] : [wrapIndex(E.cur - 1, n, loop), E.cur];

  const peekTo = (zone: 0 | 1 | -1, tilt: number) => {
    let t = E.turn;
    if (t && !t.peek) return;
    if (zone === 0 || !canTurn(zone)) {
      if (t) {
        t.target = startEnd(t);
        E.kick();
      }
      return;
    }
    if (t && t.kind !== zone) {
      E.turn = null;
      t = null;
    }
    if (!t) {
      const [from, to] = sheets(zone);
      t = E.turn = makeTurn(zone, tilt, from, to, true);
    }
    t.target = zone === 1 ? t.ends.rest - PEEK_NEXT : t.ends.lo - RADIUS + PEEK_PREV;
    E.kick();
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !ready) return;
    setStopped(true);
    const r = e.currentTarget.getBoundingClientRect();
    const kind: 1 | -1 = e.clientX - r.left > r.width / 2 ? 1 : -1;
    if (!canTurn(kind)) return;
    let t = E.turn;
    if (t && !(t.peek && t.kind === kind)) {
      finishNow();
      t = null;
    }
    if (!t) {
      const [from, to] = sheets(kind);
      t = E.turn = makeTurn(kind, tiltAt(e.clientY, r), from, to, false);
      if (kind === -1) t.fold = t.ends.lo - RADIUS;
    }
    t.dragging = true;
    t.peek = false;
    t.v = 0;
    const grab = kind === 1 ? travelForFoldNext(t.ends.rest, t.fold, RADIUS) : Math.max(t.fold - (t.ends.lo - RADIUS), 0);
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = {
      id: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      lastT: e.timeStamp,
      h: r.height,
      grab,
      vel: 0,
      moved: false,
    };
    setHolding(true);
    E.kick();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const t = E.turn;
    if (!d || e.pointerId !== d.id || !t) {
      if (!d && hoverable && !reduced && ready) {
        const r = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const tilt = Math.min(Math.max(tiltAt(e.clientY, r) * 1.8, -0.75), 0.75);
        const z = x > 0.86 ? 1 : x < 0.14 ? -1 : 0;
        setZone(z);
        peekTo(z, tilt);
      }
      return;
    }
    const sign = t.kind === 1 ? -1 : 1;
    const along = ((e.clientX - d.x0) * t.dir[0] - (e.clientY - d.y0) * t.dir[1]) / d.h;
    const travel = d.grab + sign * along;
    const fold =
      t.kind === 1 ? dragFoldNext(t.ends.rest, travel, RADIUS) : t.ends.lo - RADIUS + Math.max(travel, 0);
    t.fold = Math.min(Math.max(fold, t.ends.gone), t.ends.rest);

    const dt = Math.max(e.timeStamp - d.lastT, 1);
    const step = ((e.clientX - d.lastX) * t.dir[0] - (e.clientY - d.lastY) * t.dir[1]) * sign;
    d.vel = d.vel * 0.6 + (step / dt) * 0.4;
    d.lastX = e.clientX;
    d.lastY = e.clientY;
    d.lastT = e.timeStamp;
    if (Math.hypot(e.clientX - d.x0, e.clientY - d.y0) > 6) d.moved = true;
    E.kick();
  };

  const release = (e: React.PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    drag.current = null;
    setHolding(false);
    const t = E.turn;
    if (!t) return;
    t.dragging = false;
    t.omega = OMEGA_TURN;
    const { rest, gone, mid } = t.ends;
    let commit = false;
    if (!cancelled) {
      commit = d.moved
        ? shouldCommit(t.kind === 1 ? rest - t.fold : t.fold - gone, t.kind === 1 ? rest - mid : mid - gone, d.vel)
        : true;
    }
    t.target = commit ? commitEnd(t) : startEnd(t);
    const perSecond = (d.vel * 1000) / d.h;
    const ratio = t.kind === 1 && rest - t.fold >= Math.PI * RADIUS ? 0.5 : 1;
    t.v = d.moved ? (t.kind === 1 ? -perSecond : perSecond) * ratio : 0;
    if (commit) commitTo(landsOn(t));
    if (reduced) resolve(t, t.target);
    E.kick();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") setStopped(true);
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(active + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(active - 1);
    }
  };

  const playing = autoplay > 0 && !reduced && n > 1 && ready && !stopped && (loop || active < n - 1);
  const paused = zone !== 0 || overRail || focused || holding || hidden || !inView;

  const current = items[active];
  const atStart = !loop && active === 0;
  const atEnd = !loop && active === n - 1;
  const announce = current
    ? (current.title ?? current.alt ?? "Slide") + ", " + (active + 1) + " of " + n
    : "";

  return (
    <section
      ref={rootRef}
      className={"pcc-root " + className}
      style={{ height }}
      role="region"
      aria-roledescription="carousel"
      aria-label="Best Student Paper Curl Carousel"
      data-paused={paused}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      <style>{CSS}</style>
      <div
        className="pcc-stage"
        style={{ background: paper }}
        tabIndex={0}
        aria-label="Slides. Drag a sheet or use the arrow keys to turn it."
        data-holding={holding}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => release(e, false)}
        onPointerCancel={(e) => release(e, true)}
        onPointerLeave={() => {
          setZone(0);
          if (!drag.current) peekTo(0, 0);
        }}
      >
        {failed ? (
          current ? (
            <img className="pcc-fallback" src={current.src} alt={current.alt ?? ""} draggable={false} />
          ) : null
        ) : (
          <canvas ref={canvasRef} className="pcc-canvas" style={{ opacity: ready ? 1 : 0 }} aria-hidden="true" />
        )}

        {!rail && n > 1 ? (
          <div className="absolute inset-y-0 inset-x-2.5 flex items-center justify-between pointer-events-none opacity-0 hover:opacity-100 transition-opacity z-10">
            <button
              type="button"
              className="pointer-events-auto flex items-center justify-center w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs transition-transform active:scale-95 shadow-md border border-white/20"
              onClick={(e) => {
                e.stopPropagation();
                setStopped(true);
                go(active - 1);
              }}
              disabled={atStart}
              aria-label="Previous certificate"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              className="pointer-events-auto flex items-center justify-center w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs transition-transform active:scale-95 shadow-md border border-white/20"
              onClick={(e) => {
                e.stopPropagation();
                setStopped(true);
                go(active + 1);
              }}
              disabled={atEnd}
              aria-label="Next certificate"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        ) : null}
      </div>

      {rail && n > 0 ? (
        <div className="pcc-rail" onPointerEnter={() => setOverRail(true)} onPointerLeave={() => setOverRail(false)}>
          <div className="pcc-caption" key={active}>
            <span className="pcc-count">
              <b>{pad(active + 1)}</b> / {pad(n)}
            </span>
            <div className="flex flex-col min-w-0">
              {current?.title ? <span className="pcc-title truncate">{current.title}</span> : null}
              {current?.caption ? <span className="pcc-sub truncate">{current.caption}</span> : null}
            </div>
          </div>
          <div className="pcc-controls">
            <button
              type="button"
              className="pcc-btn"
              onClick={() => {
                setStopped(true);
                go(active - 1);
              }}
              disabled={atStart || n < 2}
              aria-label="Previous slide"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              className="pcc-btn"
              onClick={() => {
                setStopped(true);
                go(active + 1);
              }}
              disabled={atEnd || n < 2}
              aria-label="Next slide"
            >
              {playing ? (
                <svg className="pcc-ring" key={"ring-" + active} viewBox="0 0 34 34" aria-hidden="true">
                  <circle cx="17" cy="17" r="15.5" style={{ animationDuration: autoplay + "ms" }} />
                </svg>
              ) : null}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      ) : null}

      {playing ? (
        <span
          className="pcc-clock"
          key={"clock-" + active}
          style={{ animationDuration: autoplay + "ms" }}
          onAnimationEnd={() => go(active + 1)}
          aria-hidden="true"
        />
      ) : null}

      <p className="pcc-sr" aria-live="polite">
        {announce}
      </p>
    </section>
  );
}

