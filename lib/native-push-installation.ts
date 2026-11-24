const cookieName = (request: Request) => new URL(request.url).protocol === 'https:' ? '__Host-hoan_native_push' : 'hoan_native_push_local';

export function nativeInstallationSecret(request: Request) {
  const prefix = cookieName(request) + '=';
  const value = request.headers.get('Cookie')?.split(';').map(item => item.trim())
    .find(item => item.startsWith(prefix))?.slice(prefix.length);
  return value && /^[a-f0-9]{64}$/.test(value) ? value : '';
}

export function nativeInstallationCookie(request: Request, secret: string, maxAge = 31_536_000) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return cookieName(request) + '=' + secret + '; Path=/; HttpOnly; SameSite=Strict; Max-Age=' + maxAge + secure;
}
