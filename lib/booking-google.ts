import { env } from "cloudflare:workers";
import { createRemoteJWKSet, errors, jwtVerify } from "jose";
import { limitSensitiveRequest, protectionSettings } from "./data-guards";
import { formError, normalizePhone, samePhone, validEmail } from "./form-errors";
import { adminTransport, privateHeaders } from "./site-admin";

const googleSettings = env as unknown as { GOOGLE_CLIENT_ID?: string };
const lifetime = 5 * 60_000;
const maxBookings = 25;
const googleKeys = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"), { timeoutDuration: 6_000 });

function clientId() {
  const id = googleSettings.GOOGLE_CLIENT_ID?.trim() || "";
  return /^[a-z0-9_-]+\.apps\.googleusercontent\.com$/i.test(id) ? id : "";
}

export const bookingGoogleEnabled = () => Boolean(clientId());

function respond(body: object, status = 200) {
  return Response.json(body, { status, headers: privateHeaders });
}

const expired = () => respond({ error: "Lần xác minh Google đã hết hiệu lực. Vui lòng bắt đầu lại." }, 410);
const rejected = () => respond({ error: "Không xác minh được tài khoản Google. Vui lòng thử lại." }, 401);

async function digest(value: string) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
}

function googleEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function ticketDigest(ticket: string, email: string) {
  return digest("google-ticket:" + ticket + (email ? ":" + email : ""));
}

async function start(request: Request, payload: Record<string, unknown>, audience: string, origin: string, email: string) {
  const purpose = payload.purpose;
  if (purpose !== "link" && purpose !== "recovery") return respond({ error: "Yêu cầu Google không hợp lệ." }, 400);
  const limited = await limitSensitiveRequest(request, "booking-google-start");
  if (limited) return limited;

  const db = protectionSettings.DB;
  let appointmentCode: string | null = null;
  let phoneSnapshot: string | null = null;
  if (purpose === "link") {
    const code = typeof payload.code === "string" ? payload.code.trim().toUpperCase() : "";
    const phone = normalizePhone(payload.phone);
    if (!code || !phone || code.length > 60 || phone.length > 30) {
      return formError({
        ...(!code || code.length > 60 ? { code: "Vui lòng nhập mã lịch hẹn." } : {}),
        ...(!phone || phone.length > 30 ? { phone: "Vui lòng nhập số điện thoại đã dùng khi đặt lịch." } : {}),
      });
    }
    const appointment = await db.prepare("SELECT code, phone FROM appointments WHERE code = ? AND archived_at IS NULL")
      .bind(code).first<{ code: string; phone: string }>();
    if (!appointment || !samePhone(appointment.phone, phone)) return respond({ error: "Không tìm thấy lịch phù hợp." }, 404);
    appointmentCode = appointment.code;
    phoneSnapshot = appointment.phone;
  }

  const ticket = Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, "0")).join("");
  const now = Date.now();
  await db.batch([
    db.prepare("DELETE FROM booking_google_challenges WHERE expires_at <= ?").bind(now),
    db.prepare(`INSERT INTO booking_google_challenges (ticket_hash, origin, purpose, appointment_code, phone_snapshot, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)`).bind(await ticketDigest(ticket, email), origin, purpose, appointmentCode, phoneSnapshot, now + lifetime),
  ]);
  return respond({ ticket, clientId: audience });
}

async function linkAppointment(ticketHash: string, origin: string, subject: string) {
  const db = protectionSettings.DB;
  const now = Date.now();
  const selection = `FROM booking_google_challenges c JOIN appointments a ON a.code = c.appointment_code AND a.phone = c.phone_snapshot
    WHERE c.ticket_hash = ? AND c.origin = ? AND c.purpose = 'link' AND c.expires_at > ? AND a.archived_at IS NULL`;
  const [, matches, consumed] = await db.batch([
    db.prepare(`INSERT INTO booking_google_links (appointment_code, subject_key, linked_at)
      SELECT a.code, ?, ? ${selection} ON CONFLICT(appointment_code) DO NOTHING`)
      .bind(subject, now, ticketHash, origin, now),
    db.prepare(`SELECT a.code ${selection} AND EXISTS
      (SELECT 1 FROM booking_google_links b WHERE b.appointment_code = a.code AND b.subject_key = ?)`)
      .bind(ticketHash, origin, now, subject),
    db.prepare("DELETE FROM booking_google_challenges WHERE ticket_hash = ? AND origin = ? AND expires_at > ? RETURNING ticket_hash")
      .bind(ticketHash, origin, now),
  ]);
  if (!consumed.results.length) return expired();
  if (!matches.results.length) return respond({ error: "Lịch đã liên kết với tài khoản khác hoặc thông tin lịch đã thay đổi." }, 409);
  return respond({ linked: true });
}

async function finish(request: Request, payload: Record<string, unknown>, audience: string, origin: string, email: string) {
  const { ticket, credential } = payload;
  if (typeof ticket !== "string" || !/^[0-9a-f]{64}$/.test(ticket)) return expired();
  if (typeof credential !== "string" || credential.length > 8192) return rejected();
  const limited = await limitSensitiveRequest(request, "booking-google-check");
  if (limited) return limited;

  const db = protectionSettings.DB;
  const hash = await ticketDigest(ticket, email);
  const purpose = email ? "recovery" : "link";
  const active = await db.prepare("SELECT ticket_hash FROM booking_google_challenges WHERE ticket_hash = ? AND origin = ? AND purpose = ? AND expires_at > ?")
    .bind(hash, origin, purpose, Date.now()).first();
  if (!active) return expired();

  let subject: string;
  try {
    const { payload: claims } = await jwtVerify(credential, googleKeys, {
      algorithms: ["RS256"], audience, issuer: ["https://accounts.google.com", "accounts.google.com"],
      requiredClaims: ["sub", "exp", "iat", "nonce"], maxTokenAge: 300, clockTolerance: 5,
    });
    if (claims.nonce !== ticket || !claims.sub || claims.sub.length > 255 || (claims.azp && claims.azp !== audience)) return rejected();
    if (email && (claims.email_verified !== true || googleEmail(claims.email) !== email)) {
      return respond({ error: "Hãy chọn tài khoản Google có email trùng với địa chỉ bạn đã nhập." }, 401);
    }
    subject = await digest("google-customer:" + claims.sub);
  } catch (error) {
    if (error instanceof errors.JWKSTimeout) return respond({ error: "Google chưa phản hồi. Vui lòng thử lại." }, 503);
    return rejected();
  }

  if (purpose === "link") return linkAppointment(hash, origin, subject);
  const used = await db.prepare(`DELETE FROM booking_google_challenges
    WHERE ticket_hash = ? AND origin = ? AND purpose = 'recovery' AND expires_at > ? RETURNING ticket_hash`)
    .bind(hash, origin, Date.now()).first();
  if (!used) return expired();
  const { results } = await db.prepare(`SELECT a.code, a.date, a.time, COALESCE(s.name, '') AS service
    FROM booking_google_links b JOIN appointments a ON a.code = b.appointment_code
    LEFT JOIN services s ON s.id = a.service_id WHERE b.subject_key = ? AND a.archived_at IS NULL
    ORDER BY a.date DESC, a.time DESC, a.code DESC LIMIT ?`).bind(subject, maxBookings + 1).all();
  return respond({ bookings: results.slice(0, maxBookings), hasMore: results.length > maxBookings });
}

export async function handleBookingGoogle(request: Request, payload: Record<string, unknown>, step: "start" | "finish") {
  if (!adminTransport(request)) return respond({ error: "Xác minh Google yêu cầu kết nối HTTPS." }, 403);
  const needsEmail = step === "start" ? payload.purpose === "recovery" : Object.hasOwn(payload, "email");
  const email = needsEmail ? googleEmail(payload.email) : "";
  if (needsEmail && !validEmail(email)) {
    return formError({ email: email ? "Nhập địa chỉ email hợp lệ." : "Vui lòng nhập địa chỉ email." });
  }
  const audience = clientId();
  if (!audience) return respond({ error: "Xác minh email hiện tạm thời chưa khả dụng. Vui lòng thử lại sau." }, 503);
  const origin = new URL(request.url).origin;
  return step === "start" ? start(request, payload, audience, origin, email) : finish(request, payload, audience, origin, email);
}
