import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(self \"https://*.daily.co\"), microphone=(self \"https://*.daily.co\"), display-capture=(self \"https://*.daily.co\")",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https://*.daily.co",
      "connect-src 'self' ws: wss: https://*.daily.co wss://*.daily.co",
      "frame-src 'self' https://*.daily.co",
      "media-src 'self' data: blob: https://*.daily.co",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Trigger dev server reload for prisma client update
  // output: "standalone" hanya untuk Docker container / self-hosted VPS.
  // Pada platform Vercel, output standalone menyebabkan error nft.json pada tahap onBuildComplete.
  ...(process.env.VERCEL ? {} : { output: "standalone" }),
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 90],
    minimumCacheTTL: 60 * 60 * 24, // 24 hours
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      { source: "/guru/classes", destination: "/guru/my-class", permanent: false },
      { source: "/guru/subjects", destination: "/guru/mapel", permanent: false },
      { source: "/siswa/subjects", destination: "/siswa/mapel", permanent: false },
      { source: "/siswa/tugas", destination: "/siswa/mapel", permanent: false },
    ];
  },
};


export default nextConfig;
