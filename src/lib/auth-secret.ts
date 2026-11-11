const DEV_FALLBACK_SECRET = "alazharsdsecretkey2026modernrebuild_at_least_32_chars_long!!";

/**
 * Resolves the HMAC secret key lazily at runtime so Next.js build-time module
 * evaluation (`Collecting page data`) does not fail before runtime secrets are
 * injected (for example during Docker multi-stage builds or CI builds).
 */
export function getAuthSecretKey(): Uint8Array {
  const authSecret =
    process.env.AUTH_SECRET?.trim() || process.env.BETTER_AUTH_SECRET?.trim();

  if (process.env.NODE_ENV === "production" && (!authSecret || authSecret.length < 32)) {
    throw new Error(
      "FATAL SECURITY ERROR: AUTH_SECRET wajib disetel minimal 32 karakter di environment production!"
    );
  }

  return new TextEncoder().encode(authSecret || DEV_FALLBACK_SECRET);
}

