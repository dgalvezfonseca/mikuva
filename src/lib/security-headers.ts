const PRODUCTION_CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' https://arguz.com https://chat.arguz.net",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://chat.arguz.net",
  "font-src 'self' data: https://fonts.gstatic.com https://chat.arguz.net",
  "img-src 'self' data: blob: https://chat.arguz.net",
  "connect-src 'self' https://arguz.com https://chat.arguz.net wss://chat.arguz.net",
  "frame-src https://www.google.com https://chat.arguz.net",
  "media-src 'self' blob: https://chat.arguz.net",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

function isProduction(): boolean {
  return process.env["NODE_ENV"] === "production";
}

export function withSecurityHeaders(request: Request, response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), geolocation=(), microphone=(), payment=(), usb=()");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Cross-Origin-Opener-Policy", "same-origin");

  if (isProduction()) {
    headers.set("Content-Security-Policy", PRODUCTION_CSP);
    // Browsers ignore HSTS received over plain HTTP. Setting it here also
    // works when Apache terminates TLS and proxies to this process over HTTP.
    headers.set("Strict-Transport-Security", "max-age=31536000");
  }

  const pathname = new URL(request.url).pathname;
  if (pathname.startsWith("/api/") || pathname.startsWith("/_serverFn/")) {
    headers.set("Cache-Control", "no-store");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export { PRODUCTION_CSP };
