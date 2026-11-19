import { limitSensitiveRequest, readBoundedObject } from "../../../lib/data-guards";
import { adminTransport, endAdminSession, privateHeaders, sameOrigin, siteAdmin, startAdminSession } from "../../../lib/site-admin";
import { formError } from "../../../lib/form-errors";

const clearError = () => Response.json({ error: "Không thể xác minh phiên quản trị lúc này." }, { status: 503, headers: privateHeaders });

export async function GET(request: Request) {
  try {
    if (!await siteAdmin(request)) return Response.json({ error: "Phiên quản trị đã hết hạn." }, { status: 401, headers: privateHeaders });
    return Response.json({ ok: true }, { headers: privateHeaders });
  } catch {
    return clearError();
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request) || !adminTransport(request)) {
    return Response.json({ error: "Mở trang quản trị qua kết nối an toàn để đăng nhập." }, { status: 403, headers: privateHeaders });
  }
  try {
    let data;
    try { data = await readBoundedObject(request, 4096); }
    catch { return Response.json({ error: "Dữ liệu đăng nhập không hợp lệ." }, { status: 400, headers: privateHeaders }); }
    const key = typeof data.key === "string" ? data.key.trim() : "";
    if (!key) return formError({ token: "Vui lòng nhập khóa quản trị." });
    const limited = await limitSensitiveRequest(request, "admin-login");
    if (limited) return limited;
    const cookie = await startAdminSession(request, key);
    if (!cookie) return formError({ token: "Khóa quản trị không đúng. Vui lòng kiểm tra và nhập lại." }, 401);
    return Response.json({ ok: true }, { headers: { ...privateHeaders, "Set-Cookie": cookie } });
  } catch {
    return clearError();
  }
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Nguồn yêu cầu không hợp lệ." }, { status: 403, headers: privateHeaders });
  try {
    const cookie = await endAdminSession(request);
    return Response.json({ ok: true }, { headers: { ...privateHeaders, "Set-Cookie": cookie } });
  } catch {
    return clearError();
  }
}
