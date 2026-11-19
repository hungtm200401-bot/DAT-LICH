export function withSecurityHeaders(response: Response, googleSignIn = false): Response {
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'same-origin');
  headers.set('X-Frame-Options', 'SAMEORIGIN');
  if (googleSignIn && /^text\/html(?:;|$)/i.test(headers.get('Content-Type') || '')) {
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (!headers.has('Cross-Origin-Opener-Policy')) headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  }
  // Same-origin CMS previews remain available; script nonces are a separate migration.
  if (!headers.has('Content-Security-Policy')) headers.set('Content-Security-Policy', "frame-ancestors 'self'; object-src 'none'; base-uri 'self'");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
