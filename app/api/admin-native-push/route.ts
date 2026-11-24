import { adminSessionHash, adminTransport, privateHeaders, sameOrigin, siteAdmin } from '../../../lib/site-admin';
import { limitSensitiveRequest, protectionSettings, readBoundedObject } from '../../../lib/data-guards';
import { newPushInstallationSecret, pushInstallationId } from '../../../lib/admin-push-installation';
import { nativeInstallationCookie, nativeInstallationSecret } from '../../../lib/native-push-installation';
import { nativePushConfig, nativePushGeneration, removeNativeInstallation, sendNativePush, validNativeToken, type NativeInstallation } from '../../../lib/admin-apns';

const response = (value: object, status = 200, cookie?: string) => Response.json(value, { status, headers: cookie ? { ...privateHeaders, 'Set-Cookie': cookie } : privateHeaders });
const denied = () => response({ error: 'Cần đăng nhập quản trị để bật thông báo iPhone.' }, 401);
const unavailable = () => response({ error: 'Máy chủ chưa gửi được thông báo iPhone. Kiểm tra cấu hình APNs và thử lại.' }, 503);

export async function GET(request: Request) {
  try {
    if (!await siteAdmin(request)) return denied();
    const config = nativePushConfig();
    if (!config) return response({ available: false, enabled: false });
    const id = await pushInstallationId(nativeInstallationSecret(request));
    const device = id && await protectionSettings.DB.prepare('SELECT id FROM admin_apns_installations WHERE id=? AND generation=?')
      .bind(id, await nativePushGeneration(config)).first();
    return response({ available: true, enabled: Boolean(device), environment: config.environment });
  } catch { return unavailable(); }
}

export async function POST(request: Request) {
  if (!adminTransport(request) || !sameOrigin(request)) return denied();
  try {
    const session = await adminSessionHash(request);
    if (!session || !await siteAdmin(request)) return denied();
    const config = nativePushConfig();
    if (!config) return unavailable();
    let input;
    try { input = await readBoundedObject(request, 4096); } catch { return response({ error: 'Dữ liệu thiết bị không hợp lệ.' }, 400); }
    const db = protectionSettings.DB;
    const generation = await nativePushGeneration(config);
    const secret = nativeInstallationSecret(request);
    const id = await pushInstallationId(secret);
    if (input.action === 'test') {
      const limited = await limitSensitiveRequest(request, 'admin-native-push-test', id || session);
      if (limited) return limited;
      const device = id && await db.prepare('SELECT id,device_token,environment,updated_at FROM admin_apns_installations WHERE id=? AND generation=?')
        .bind(id, generation).first<NativeInstallation>();
      if (!device) return response({ error: 'Bật thông báo trên iPhone này trước khi gửi thử.' }, 409);
      const result = await sendNativePush(device, config, '', 'test:' + crypto.randomUUID(), Date.now() + 300_000);
      if (result.status === 410 || (result.status === 400 && result.reason === 'BadDeviceToken')) {
        await removeNativeInstallation(device, result.timestamp);
        return response({ error: 'Đăng ký Apple đã hết hạn hoặc không khớp môi trường. Bật lại thông báo.' }, 410);
      }
      return result.status === 200 ? response({ accepted: true }) : unavailable();
    }
    if (input.action !== 'subscribe' || !validNativeToken(input.token) || input.environment !== config.environment) {
      return response({ error: 'Token iPhone hoặc môi trường ký chưa khớp với cấu hình máy chủ.' }, 400);
    }
    const token = input.token.toLowerCase();
    const installationSecret = secret || newPushInstallationSecret();
    const installationId = id || await pushInstallationId(installationSecret);
    const now = Date.now();
    const validSession = 'EXISTS (SELECT 1 FROM admin_sessions WHERE token_hash=? AND expires_at>?)';
    const [,, saved] = await db.batch([
      db.prepare('DELETE FROM admin_apns_jobs WHERE installation_id IN (SELECT id FROM admin_apns_installations WHERE id=? AND (device_token<>? OR environment<>? OR generation<>?)) AND ' + validSession)
        .bind(installationId, token, config.environment, generation, session, now),
      db.prepare('DELETE FROM admin_apns_installations WHERE device_token=? AND environment=? AND id<>? AND ' + validSession)
        .bind(token, config.environment, installationId, session, now),
      db.prepare('INSERT INTO admin_apns_installations (id,generation,session_hash,device_token,environment,created_at,updated_at) SELECT ?,?,?,?,?,?,? WHERE ' + validSession +
        ' ON CONFLICT(id) DO UPDATE SET generation=excluded.generation,session_hash=excluded.session_hash,device_token=excluded.device_token,environment=excluded.environment,updated_at=excluded.updated_at,' +
        'created_at=CASE WHEN admin_apns_installations.generation=excluded.generation AND admin_apns_installations.device_token=excluded.device_token AND admin_apns_installations.environment=excluded.environment THEN admin_apns_installations.created_at ELSE excluded.created_at END')
        .bind(installationId, generation, session, token, config.environment, now, now, session, now),
    ]);
    if (!saved.meta.changes) return denied();
    return response({ enabled: true }, 201, nativeInstallationCookie(request, installationSecret));
  } catch { return unavailable(); }
}

export async function DELETE(request: Request) {
  if (!adminTransport(request) || !sameOrigin(request)) return denied();
  try {
    const id = await pushInstallationId(nativeInstallationSecret(request));
    if (id) await protectionSettings.DB.prepare('DELETE FROM admin_apns_installations WHERE id=?').bind(id).run();
    return response({ enabled: false }, 200, nativeInstallationCookie(request, '', 0));
  } catch { return unavailable(); }
}
