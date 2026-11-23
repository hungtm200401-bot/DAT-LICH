import { limitSensitiveRequest, protectionSettings, readBoundedObject } from "../../../lib/data-guards";
import { adminSessionHash, adminTransport, privateHeaders, sameOrigin, siteAdmin } from "../../../lib/site-admin";
import {
  newPushInstallationSecret, pushInstallationCookie, pushInstallationId, pushInstallationSecret,
} from "../../../lib/admin-push-installation";
import {
  adminPushConfig, pushGeneration, readPushSubscription, removeGonePushDevice, sendAdminPush, type PushDestination,
} from "../../../lib/admin-web-push";

const response = (value: object, status = 200, cookie?: string) =>
  Response.json(value, { status, headers: cookie ? { ...privateHeaders, "Set-Cookie": cookie } : privateHeaders });
const denied = () => response({ error: "Cần đăng nhập quản trị để bật thông báo." }, 401);
const unavailable = () => response({ error: "Chưa thể kết nối dịch vụ thông báo. Vui lòng thử lại." }, 503);
const validRequest = (request: Request) => adminTransport(request) && sameOrigin(request);

export async function GET(request: Request) {
  try {
    if (!await siteAdmin(request)) return denied();
    const config = adminPushConfig();
    if (!config) return response({ available: false, enabled: false });
    const id = await pushInstallationId(pushInstallationSecret(request));
    const device = id && await protectionSettings.DB.prepare(
      "SELECT id FROM admin_push_subscriptions WHERE id = ? AND generation = ?"
    ).bind(id, await pushGeneration(config)).first();
    return response({ available: true, enabled: Boolean(device), publicKey: config.publicKey });
  } catch {
    return unavailable();
  }
}

export async function POST(request: Request) {
  if (!validRequest(request)) return denied();
  try {
    const session = await adminSessionHash(request);
    if (!session || !await siteAdmin(request)) return denied();
    const config = adminPushConfig();
    if (!config) return unavailable();
    let input;
    try { input = await readBoundedObject(request, 8192); }
    catch { return response({ error: "Dữ liệu thông báo không hợp lệ." }, 400); }
    const db = protectionSettings.DB;
    const generation = await pushGeneration(config);
    const existing = pushInstallationSecret(request);
    if (input.action === "test") {
      const id = await pushInstallationId(existing);
      const limited = await limitSensitiveRequest(request, "admin-push-test", id || session);
      if (limited) return limited;
      const device = id && await db.prepare(
        "SELECT id, endpoint, p256dh, auth, updated_at FROM admin_push_subscriptions WHERE id = ? AND generation = ?"
      ).bind(id, generation).first<PushDestination>();
      if (!device) return response({ error: "Bật thông báo trên máy này trước khi gửi thử." }, 409);
      const status = await sendAdminPush(device, config, "test", "", "test:" + crypto.randomUUID(), Date.now() + 300_000);
      if (status === 404 || status === 410) {
        await removeGonePushDevice(device);
        return response({ error: "Đăng ký đã hết hạn. Bật lại thông báo trên máy này." }, 410);
      }
      return status >= 200 && status < 300 ? response({ ok: true }) : unavailable();
    }

    if (input.action !== "subscribe" || input.publicKey !== config.publicKey) {
      return response({ error: "Tải lại ứng dụng để nhận cấu hình thông báo mới." }, 400);
    }
    const subscription = await readPushSubscription(input.subscription);
    if (!subscription) return response({ error: "Thiết bị chưa cung cấp đăng ký thông báo hợp lệ." }, 400);
    const secret = existing || newPushInstallationSecret();
    const id = await pushInstallationId(secret);
    const now = Date.now();
    const validSession = "EXISTS (SELECT 1 FROM admin_sessions WHERE token_hash = ? AND expires_at > ?)";
    const [,, saved] = await db.batch([
      db.prepare(
        "DELETE FROM admin_push_jobs WHERE subscription_id IN (" +
          "SELECT id FROM admin_push_subscriptions WHERE id = ? AND (endpoint <> ? OR generation <> ? OR p256dh <> ? OR auth <> ?)" +
        ") AND " + validSession
      ).bind(id, subscription.endpoint, generation, subscription.p256dh, subscription.auth, session, now),
      db.prepare(
        "DELETE FROM admin_push_subscriptions WHERE endpoint = ? AND id <> ? AND p256dh = ? AND auth = ? AND " + validSession
      ).bind(subscription.endpoint, id, subscription.p256dh, subscription.auth, session, now),
      db.prepare(
        "INSERT INTO admin_push_subscriptions (id, generation, endpoint, p256dh, auth, created_at, updated_at) " +
        "SELECT ?, ?, ?, ?, ?, ?, ? WHERE " + validSession +
        " ON CONFLICT(id) DO UPDATE SET generation=excluded.generation, endpoint=excluded.endpoint, p256dh=excluded.p256dh, " +
        "auth=excluded.auth, updated_at=excluded.updated_at, " +
        "created_at=CASE WHEN admin_push_subscriptions.endpoint=excluded.endpoint AND admin_push_subscriptions.generation=excluded.generation " +
          "THEN admin_push_subscriptions.created_at ELSE excluded.created_at END"
      ).bind(id, generation, subscription.endpoint, subscription.p256dh, subscription.auth, now, now, session, now),
    ]);
    if (!saved.meta.changes) return denied();
    return response({ ok: true, enabled: true }, 201, pushInstallationCookie(request, secret));
  } catch {
    return unavailable();
  }
}

export async function DELETE(request: Request) {
  if (!validRequest(request)) return denied();
  try {
    const id = await pushInstallationId(pushInstallationSecret(request));
    if (id) await protectionSettings.DB.prepare("DELETE FROM admin_push_subscriptions WHERE id = ?").bind(id).run();
    return response({ ok: true }, 200, pushInstallationCookie(request, "", 0));
  } catch {
    return unavailable();
  }
}
