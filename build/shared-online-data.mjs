export const ONLINE_ORIGIN = 'https://hoan-makeup-artist.hoan-makeup.workers.dev';
const runtimePath = '/__hoan/runtime';
const aliases = new Map([
  ['__Host-hoan_admin', 'hoan_shared_admin'],
  ['__Host-hoan_push', 'hoan_shared_push'],
  ['__Host-hoan_native_push', 'hoan_shared_native_push'],
  ['hoan_visit', 'hoan_shared_visit'],
]);
const upstreamNames = new Map([...aliases].map(([name, alias]) => [alias, name]));
const loopbackHosts = new Set(['127.0.0.1', 'localhost', '::1', '[::1]']);
const apiPath = url => /^\/api(?:\/|\?|$)/.test(url || '');

export function dataSourceMode(value) {
  const mode = value || 'local';
  if (!['local', 'online'].includes(mode)) throw new Error('HOAN_DATA_SOURCE phải là online hoặc local.');
  return mode;
}

function requestOrigin(req, checkSource = true) {
  if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress)) return null;
  if (!req.url?.startsWith('/') || req.url.startsWith('//') || req.url.includes('\\')) return null;
  try {
    const protocol = req.socket.encrypted ? 'https:' : 'http:';
    const url = new URL(protocol + '//' + req.headers.host);
    if (!loopbackHosts.has(url.hostname) || url.username || url.password || url.pathname !== '/' || url.search || url.hash ||
        Number(url.port || (protocol === 'https:' ? 443 : 80)) !== req.socket.localPort) return null;
    if (!checkSource) return url.origin;
    const origin = req.headers.origin;
    if (origin && origin !== url.origin) return null;
    if (req.headers.referer) {
      const referer = new URL(req.headers.referer);
      if (referer.origin !== url.origin || referer.username || referer.password) return null;
    }
    const site = req.headers['sec-fetch-site'];
    if (site && !['same-origin', 'none'].includes(site)) return null;
    if (req.headers.upgrade) return null;
    return url.origin;
  } catch { return null; }
}

function jsonError(res, status, message) {
  if (res.destroyed) return;
  if (res.headersSent) { res.destroy(); return; }
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify({ error: message }));
}

function forwardCookies(value) {
  const selected = new Map();
  for (const entry of (value || '').split(';')) {
    const index = entry.indexOf('=');
    if (index < 1) continue;
    const name = upstreamNames.get(entry.slice(0, index).trim());
    if (name && !selected.has(name)) selected.set(name, entry.slice(index + 1).trim());
  }
  return [...selected].map(([name, secret]) => name + '=' + secret).join('; ');
}

function localCookie(value, secure) {
  const [pair, ...attributes] = value.split(';');
  const index = pair.indexOf('=');
  const alias = aliases.get(pair.slice(0, index).trim());
  if (!alias || index < 1) return null;
  const kept = attributes.map(value => value.trim()).filter(value => !/^(?:Domain|Path|Secure|HttpOnly|SameSite|Partitioned)(?:=|$)/i.test(value));
  return alias + pair.slice(index) + '; ' + [...kept, 'Path=/', 'HttpOnly', 'SameSite=Strict', ...(secure ? ['Secure'] : [])].join('; ');
}

/** Dev only. The application calls this with the fixed IPA origin; loopback HTTP is dependency injection for isolated tests. @returns {import('vite').Plugin} */
export function sharedOnlineData(selectedMode, { origin = ONLINE_ORIGIN, allowInsecureLoopback = false, timeout = 30_000 } = {}) {
  const mode = dataSourceMode(selectedMode);
  const target = new URL(origin);
  if (target.username || target.password || target.pathname !== '/' || target.search || target.hash ||
      (target.protocol !== 'https:' && !(allowInsecureLoopback && target.protocol === 'http:' && loopbackHosts.has(target.hostname)))) {
    throw new Error('Máy chủ dữ liệu chung phải là HTTPS origin hợp lệ.');
  }
  const descriptor = { version: 1, mode, origin: mode === 'online' ? target.origin : null };
  return {
    name: 'hoan-shared-online-data',
    apply: 'serve',
    enforce: 'pre',
    config() {
      if (mode !== 'online') return;
      return { server: { proxy: {
        '^/api(?:/|\\?|$)': {
          target: target.origin, changeOrigin: true, secure: true, ws: false,
          followRedirects: false, proxyTimeout: timeout,
          configure(proxy) {
            proxy.on('proxyReq', (outgoing, req) => {
              // The pre-proxy guard validated the caller before these headers are rewritten.
              for (const name of outgoing.getHeaderNames()) {
                if (/^(?:cookie|authorization|forwarded|x-real-ip|x-forwarded-.*|cf-.*)$/i.test(name)) outgoing.removeHeader(name);
              }
              const cookies = forwardCookies(req.headers.cookie);
              if (cookies) outgoing.setHeader('Cookie', cookies);
              outgoing.setHeader('Origin', target.origin);
              if (req.headers.referer) outgoing.setHeader('Referer', target.origin + '/');
            });
            proxy.on('proxyRes', (incoming, req, res) => {
              const cookies = (incoming.headers['set-cookie'] || []).map(value => localCookie(value, Boolean(req.socket.encrypted))).filter(Boolean);
              if (cookies.length) incoming.headers['set-cookie'] = cookies;
              else delete incoming.headers['set-cookie'];
              for (const name of Object.keys(incoming.headers)) if (name.startsWith('access-control-')) delete incoming.headers[name];
              incoming.headers['cache-control'] = 'no-store';
              incoming.headers['x-hoan-data-source'] = 'online';
              incoming.headers['x-hoan-data-origin'] = target.origin;
              if (incoming.headers.location) {
                try {
                  const location = new URL(incoming.headers.location, target);
                  const localOrigin = requestOrigin(req);
                  if (location.origin !== target.origin || location.username || location.password || !localOrigin) throw new Error('Foreign redirect');
                  incoming.headers.location = localOrigin + location.pathname + location.search + location.hash;
                } catch {
                  // followRedirects:false alone would still let the browser replay a 307/308 POST elsewhere.
                  jsonError(res, 502, 'Máy chủ yêu cầu chuyển sang địa chỉ khác. Yêu cầu đã được dừng để bảo vệ dữ liệu.');
                  incoming.destroy();
                }
              }
            });
            proxy.on('error', (error, _req, res) => {
              if (res && 'writeHead' in res) {
                jsonError(res, error.code === 'ETIMEDOUT' ? 504 : 502,
                  'Chưa xác nhận được kết quả từ máy chủ online. Kiểm tra lại lịch hoặc giao dịch trước khi thử lại.');
              }
            });
          },
        },
      } } };
    },
    configResolved(config) {
      if (mode === 'online' && config.server.host !== undefined && config.server.host !== false && !loopbackHosts.has(config.server.host)) {
        throw new Error('Chế độ dữ liệu online chỉ chạy trên 127.0.0.1, localhost hoặc ::1; không mở LAN/tunnel.');
      }
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (mode === 'online') {
          const localOrigin = requestOrigin(req, false);
          if (!localOrigin) return jsonError(res, 403, 'Địa chỉ máy chủ dữ liệu chung không hợp lệ.');
          // Reject spellings that could evade the proxy and later normalize to a local API route.
          try {
            let path = new URL(req.url, localOrigin).pathname;
            for (let depth = 0; depth < 6; depth++) {
              const decoded = new URL(decodeURIComponent(path).replaceAll('\\', '/'), localOrigin);
              if (decoded.origin !== localOrigin || (apiPath(decoded.pathname) && req.url.split('?')[0] !== decoded.pathname)) {
                return jsonError(res, 403, 'Đường dẫn dữ liệu không hợp lệ.');
              }
              if (decoded.pathname === path) break;
              path = decoded.pathname;
            }
          } catch { return jsonError(res, 400, 'Đường dẫn không hợp lệ.'); }
        }
        const runtime = req.url?.split('?')[0] === runtimePath;
        if (!runtime && !apiPath(req.url)) return next();
        if ((mode === 'online' || runtime) && !requestOrigin(req)) {
          return jsonError(res, 403, 'Chỉ trang trên chính máy này được dùng kết nối dữ liệu chung.');
        }
        res.setHeader('X-Hoan-Data-Source', mode);
        if (mode === 'online') res.setHeader('X-Hoan-Data-Origin', target.origin);
        if (!runtime) return next();
        if (req.method !== 'GET') return jsonError(res, 405, 'Chỉ hỗ trợ đọc nguồn dữ liệu.');
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify(descriptor));
      });
    },
  };
}
