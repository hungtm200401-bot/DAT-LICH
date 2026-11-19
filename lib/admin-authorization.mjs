export function sameOrigin(request) {
  const origin = request.headers.get('Origin');
  return !origin || origin === new URL(request.url).origin;
}
export async function matchesAdminKey(supplied, token) {
  if (typeof token !== 'string' || !token.trim() || typeof supplied !== 'string' || !supplied || supplied.length > 1024) return false;
  const digest = async value => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
  const [expected, actual] = await Promise.all([digest(token), digest(supplied)]);
  return expected.reduce((difference, value, index) => difference | (value ^ actual[index]), 0) === 0;
}
export async function verifyAdminToken(request, token) {
  if (!sameOrigin(request)) return false;
  return matchesAdminKey(request.headers.get('Authorization')?.replace(/^Bearer /, '') || '', token);
}
