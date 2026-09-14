import { env } from "cloudflare:workers";
import { siteAdmin, sameOrigin, privateHeaders } from "../../../lib/site-admin";

const cookieName = "hoan_visit";
const clean = (value: unknown, limit = 120) => typeof value === "string" ? value.trim().slice(0, limit) : "";
const sessionId = (request: Request) => request.headers.get("Cookie")?.match(/(?:^|;\s*)hoan_visit=([a-f0-9-]{36})(?:;|$)/)?.[1] || "";
function pagePath(value: unknown) {
  const path = clean(value, 150).split("?")[0];
  if (!/^\/[a-zA-Z0-9/_-]*$/.test(path) || path.startsWith("/admin")) return "";
  // Booking identifiers and search terms are never analytics fields.
  if (/^\/booking\/(?!service$|time$|location$|info$|deposit$|confirm$|success$)/.test(path)) return "/booking/detail";
  return path;
}
function cookie(request: Request, id: string, remove = false) {
  return `${cookieName}=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${remove ? 0 : 1800}${new URL(request.url).protocol === "https:" ? "; Secure" : ""}`;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Nguồn yêu cầu không hợp lệ." }, { status: 403 });
  const raw = await request.text();
  if (raw.length > 4000) return Response.json({ error: "Dữ liệu quá lớn." }, { status: 413 });
  try {
    const payload = JSON.parse(raw);
    const db = env.DB;
    const id = sessionId(request);
    const now = new Date().toISOString();
    if (payload.type === "revoke") {
      if (id) await db.batch([db.prepare("DELETE FROM visit_events WHERE session_id = ?").bind(id), db.prepare("DELETE FROM visit_sessions WHERE id = ?").bind(id)]);
      return Response.json({ ok: true }, { headers: { ...privateHeaders, "Set-Cookie": cookie(request, "", true) } });
    }
    const page = pagePath(payload.page);
    if (!page) return Response.json({ error: "Trang không hợp lệ." }, { status: 400 });
    if (payload.type === "start") {
      if (payload.mode !== "anonymous") return Response.json({ error: "Chế độ thống kê không hợp lệ." }, { status: 400 });
      const existing = id ? await db.prepare("SELECT id FROM visit_sessions WHERE id = ? AND last_seen_at >= ?").bind(id, new Date(Date.now() - 1800000).toISOString()).first() : null;
      if (existing) return Response.json({ ok: true }, { headers: { ...privateHeaders, "Set-Cookie": cookie(request, id) } });
      // Exclude known link-preview crawlers. Counters describe measured browser sessions, not all Facebook clicks.
      const ua = request.headers.get("User-Agent") || "";
      if (/bot|crawler|spider|facebookexternalhit/i.test(ua)) return Response.json({ ok: true, ignored: true });
      const newId = crypto.randomUUID();
      let referrer = "";
      try { referrer = new URL(clean(payload.referrer, 1000)).hostname; } catch { /* direct */ }
      const utm = clean(payload.source, 60).toLowerCase();
      const source = utm || (/(^|\.)facebook\.com$|(^|\.)fb\.com$/.test(referrer) || payload.facebookClick === true ? "facebook" : referrer || "direct");
      const device = /iPad|Tablet/i.test(ua) ? "Máy tính bảng" : /Mobile|Android|iPhone/i.test(ua) ? "Điện thoại" : "Máy tính";
      const browser = /FBAN|FBAV/i.test(ua) ? "Facebook" : /Edg\//.test(ua) ? "Edge" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Khác";
      await db.batch([
        db.prepare("INSERT INTO visit_sessions (id,started_at,last_seen_at,source,medium,campaign,referrer,device,browser,landing_page,current_page) VALUES (?,?,?,?,?,?,?,?,?,?,?)").bind(newId, now, now, source, clean(payload.medium, 60), clean(payload.campaign), referrer, device, browser, page, page),
        db.prepare("DELETE FROM visit_events WHERE occurred_at < ?").bind(new Date(Date.now() - 90 * 86400000).toISOString()),
        db.prepare("DELETE FROM visit_sessions WHERE last_seen_at < ?").bind(new Date(Date.now() - 90 * 86400000).toISOString()),
      ]);
      return Response.json({ ok: true }, { headers: { ...privateHeaders, "Set-Cookie": cookie(request, newId) } });
    }
    if (!id) return Response.json({ error: "Phiên đã hết hạn." }, { status: 401 });
    const session = await db.prepare("SELECT id,last_seen_at FROM visit_sessions WHERE id = ? AND last_seen_at >= ?").bind(id, new Date(Date.now() - 1800000).toISOString()).first<{ id: string; last_seen_at: string }>();
    if (!session) return Response.json({ error: "Phiên đã hết hạn." }, { status: 401 });
    if (payload.type === "identify") {
      if (payload.identityConsent !== true) return Response.json({ error: "Cần đồng ý chia sẻ thông tin." }, { status: 400 });
      const facebook = clean(payload.facebookUrl, 300);
      if (facebook) {
        let valid = false;
        try { const url = new URL(facebook); valid = url.protocol === "https:" && ["facebook.com", "www.facebook.com", "m.facebook.com"].includes(url.hostname) && !url.username && !url.password; } catch { /* invalid */ }
        if (!valid) return Response.json({ error: "Link Facebook phải là https://www.facebook.com/…" }, { status: 400 });
      }
      await db.prepare("UPDATE visit_sessions SET display_name=?,facebook_url=?,declared_purpose=? WHERE id=?").bind(clean(payload.name, 80), facebook, clean(payload.purpose, 300), id).run();
    } else if (!["pageview", "click", "heartbeat", "leave", "conversion"].includes(payload.type)) {
      return Response.json({ error: "Sự kiện không hợp lệ." }, { status: 400 });
    }
    const seconds = payload.type === "heartbeat" || payload.type === "leave" ? Math.min(25, Math.max(0, Math.floor((Date.now() - Date.parse(session.last_seen_at)) / 1000)), Math.max(0, Number(payload.activeSeconds) || 0)) : 0;
    await db.batch([
      db.prepare("UPDATE visit_sessions SET last_seen_at=?,current_page=?,active_seconds=active_seconds+? WHERE id=?").bind(payload.type === "leave" ? new Date(Date.now() - 91000).toISOString() : now, page, seconds, id),
      ...(payload.type === "heartbeat" || payload.type === "leave" ? [] : [db.prepare("INSERT INTO visit_events (session_id,occurred_at,type,page,label) SELECT ?,?,?,?,? WHERE (SELECT COUNT(*) FROM visit_events WHERE session_id=?) < 1000").bind(id, now, payload.type, page, clean(payload.label), id)]),
    ]);
    return Response.json({ ok: true }, { headers: { ...privateHeaders, "Set-Cookie": cookie(request, id) } });
  } catch {
    return Response.json({ error: "Không thể ghi nhận truy cập. Kiểm tra migration cơ sở dữ liệu." }, { status: 400 });
  }
}

export async function GET(request: Request) {
  if (!await siteAdmin(request)) return Response.json({ error: "Nhập khóa quản trị để xem thống kê. Local chỉ cho phép truy cập từ máy này." }, { status: 401, headers: privateHeaders });
  const params = new URL(request.url).searchParams;
  const db = env.DB;
  const offset = Math.max(0, Math.min(100000, Number(params.get("offset")) || 0));
  const session = params.get("session");
  if (session) {
    const events = await db.prepare("SELECT occurred_at,type,page,label FROM visit_events WHERE session_id=? ORDER BY id DESC LIMIT 100 OFFSET ?").bind(session, offset).all();
    return Response.json({ events: events.results }, { headers: privateHeaders });
  }
  const days = Math.max(1, Math.min(90, Number(params.get("days")) || 7));
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const activeSince = new Date(Date.now() - 90000).toISOString();
  const source = clean(params.get("source"), 60);
  const activeOnly = params.get("active") === "1";
  const where = "started_at >= ? AND (? = '' OR source = ?) AND (? = 0 OR last_seen_at >= ?)";
  const args = [since, source, source, activeOnly ? 1 : 0, activeSince];
  const [rows, summary] = await db.batch([
    db.prepare(`SELECT *, (SELECT COUNT(*) FROM visit_events e WHERE e.session_id=visit_sessions.id AND e.type='pageview') AS pageviews FROM visit_sessions WHERE ${where} ORDER BY last_seen_at DESC LIMIT 25 OFFSET ?`).bind(...args, offset),
    db.prepare(`SELECT COUNT(*) AS total, COALESCE(SUM(last_seen_at >= ?),0) AS active, COALESCE(SUM(source='facebook'),0) AS facebook, COALESCE(SUM(display_name <> '' OR facebook_url <> ''),0) AS identified FROM visit_sessions WHERE ${where}`).bind(activeSince, ...args),
  ]);
  return Response.json({ sessions: rows.results, summary: summary.results[0], serverTime: new Date().toISOString(), activeSince, retentionDays: 90 }, { headers: privateHeaders });
}
