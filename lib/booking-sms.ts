import { env } from "cloudflare:workers";
import { keyedHash, limitSensitiveRequest, protectionSettings } from "./data-guards";
import { formError, normalizeSmsPhone } from "./form-errors";
import { adminTransport, privateHeaders } from "./site-admin";

const smsSettings = env as unknown as {
  TWILIO_VERIFY_SERVICE_SID?: string;
  TWILIO_API_KEY_SID?: string;
  TWILIO_API_KEY_SECRET?: string;
};
const OTP_DURATION = 5 * 60_000;
const BOOKING_PROOF_DURATION = 15 * 60_000;
const ATTEMPT_LIMIT = 5;
const MAX_RECOVERED = 25;

function smsConfig() {
  const service = smsSettings.TWILIO_VERIFY_SERVICE_SID?.trim() || "";
  const key = smsSettings.TWILIO_API_KEY_SID?.trim() || "";
  const secret = smsSettings.TWILIO_API_KEY_SECRET?.trim() || "";
  const signingKey = protectionSettings.ADMIN_TOKEN;
  if (!/^VA[a-f0-9]{32}$/i.test(service) || !/^SK[a-f0-9]{32}$/i.test(key) || !secret || !signingKey) return null;
  return { service, key, secret, signingKey };
}

type SmsConfig = NonNullable<ReturnType<typeof smsConfig>>;
type Purpose = "booking" | "recovery";
type VerifyResult = { sid?: string; service_sid?: string; status?: string; to?: string; code?: number };

export const bookingSmsEnabled = () => Boolean(smsConfig());

function respond(body: object, status = 200) {
  return Response.json(body, { status, headers: privateHeaders });
}

const unavailable = () => respond({ error: "Dịch vụ gửi mã SMS chưa sẵn sàng. Vui lòng thử lại sau." }, 503);
const expired = () => respond({ error: "Mã OTP đã hết hiệu lực. Vui lòng gửi mã mới." }, 410);
export const bookingPhoneRequired = () => formError({ phone: "Xác minh số điện thoại bằng OTP để tiếp tục đặt lịch." }, 428);

async function providerRequest(config: SmsConfig, action: "Verifications" | "VerificationCheck", fields: Record<string, string>) {
  const response = await fetch(`https://verify.twilio.com/v2/Services/${config.service}/${action}`, {
    method: "POST",
    headers: { Authorization: "Basic " + btoa(config.key + ":" + config.secret), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(fields),
    redirect: "manual",
    signal: AbortSignal.timeout(8_000),
  });
  const result = await response.json<VerifyResult>().catch(() => null);
  return { ok: response.ok, result, status: response.status };
}

function ticketHash(config: SmsConfig, ticket: string) {
  return keyedHash(config.signingKey, "booking-sms:" + ticket);
}

function validTicket(ticket: unknown): ticket is string {
  return typeof ticket === "string" && /^[0-9a-f]{64}$/.test(ticket);
}

async function startChallenge(request: Request, config: SmsConfig, purpose: Purpose, input: unknown) {
  const phone = normalizeSmsPhone(input);
  if (!phone) return formError({ phone: "Nhập số di động Việt Nam hoặc số quốc tế kèm mã quốc gia để nhận OTP." });
  const blocked = await limitSensitiveRequest(request, "booking-otp-send")
    || await limitSensitiveRequest(request, "booking-otp-number", phone)
    || await limitSensitiveRequest(request, "booking-otp-total", "all");
  if (blocked) return blocked;

  // Sending never reads appointments. SMS requests behave alike for every valid phone number.
  const sent = await providerRequest(config, "Verifications", { To: phone, Channel: "sms", Locale: "vi" }).catch(() => null);
  if (sent?.result?.code === 60605) return formError({ phone: "Dịch vụ SMS chưa hỗ trợ gửi OTP tới số này." }, 422);
  const sid = sent?.result?.sid;
  if (!sent?.ok || !sid || !/^VE[a-f0-9]{32}$/i.test(sid) || sent.result?.status !== "pending" || sent.result.to !== phone) {
    return unavailable();
  }
  const ticket = Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, "0")).join("");
  const now = Date.now();
  const db = protectionSettings.DB;
  await db.batch([
    db.prepare("DELETE FROM booking_sms_challenges WHERE expires_at <= ?").bind(now),
    db.prepare(`INSERT INTO booking_sms_challenges (ticket_hash, phone, purpose, verification_sid, expires_at)
      VALUES (?, ?, ?, ?, ?)`)
      .bind(await ticketHash(config, ticket), phone, purpose, sid, now + OTP_DURATION),
  ]);
  return respond({ ticket, phoneLabel: `${phone.slice(0, 3)} ••• ••${phone.slice(-3)}`, expiresIn: OTP_DURATION / 1000 });
}

async function checkChallenge(request: Request, config: SmsConfig, purpose: Purpose, ticket: unknown, value: unknown) {
  const otp = typeof value === "string" ? value.trim() : "";
  if (!/^\d{4,10}$/.test(otp)) return formError({ otp: "Nhập mã OTP trong tin nhắn SMS." });
  if (!validTicket(ticket)) return expired();
  const limited = await limitSensitiveRequest(request, "booking-otp-check");
  if (limited) return limited;

  const db = protectionSettings.DB;
  const hash = await ticketHash(config, ticket);
  const challenge = await db.prepare(`UPDATE booking_sms_challenges SET state = 'checking', attempts = attempts + 1
    WHERE ticket_hash = ? AND purpose = ? AND expires_at > ? AND state = 'pending' AND attempts < ?
    RETURNING phone, verification_sid, attempts`)
    .bind(hash, purpose, Date.now(), ATTEMPT_LIMIT).first<{ phone: string; verification_sid: string; attempts: number }>();
  if (!challenge) return expired();

  const checked = await providerRequest(config, "VerificationCheck", { VerificationSid: challenge.verification_sid, Code: otp }).catch(() => null);
  const result = checked?.result;
  const approved = checked?.ok && result?.status === "approved" && result.sid === challenge.verification_sid
    && result.to === challenge.phone && result.service_sid === config.service;
  if (!approved) {
    if (checked?.status === 404 || challenge.attempts >= ATTEMPT_LIMIT) {
      await db.prepare("DELETE FROM booking_sms_challenges WHERE ticket_hash = ?").bind(hash).run();
      return expired();
    }
    await db.prepare("UPDATE booking_sms_challenges SET state = 'pending' WHERE ticket_hash = ? AND state = 'checking'").bind(hash).run();
    return checked?.ok && result?.status === "pending" ? formError({ otp: "Mã OTP chưa đúng. Vui lòng kiểm tra tin nhắn." }) : unavailable();
  }

  if (purpose === "booking") {
    const saved = await db.prepare(`UPDATE booking_sms_challenges SET state = 'approved', expires_at = ?
      WHERE ticket_hash = ? AND state = 'checking' AND expires_at > ? RETURNING ticket_hash`)
      .bind(Date.now() + BOOKING_PROOF_DURATION, hash, Date.now()).first();
    return saved ? respond({ proof: ticket }) : expired();
  }

  const consumed = await db.prepare(`DELETE FROM booking_sms_challenges
    WHERE ticket_hash = ? AND state = 'checking' AND expires_at > ? RETURNING ticket_hash`)
    .bind(hash, Date.now()).first();
  if (!consumed) return expired();
  const { results } = await db.prepare(`SELECT a.code, a.date, a.time, COALESCE(s.name, '') AS service
    FROM booking_verified_phones v JOIN appointments a ON a.code = v.appointment_code
    LEFT JOIN services s ON s.id = a.service_id
    WHERE v.phone = ? AND a.archived_at IS NULL ORDER BY a.date DESC, a.time DESC, a.code DESC LIMIT ?`)
    .bind(challenge.phone, MAX_RECOVERED + 1).all();
  return respond({ bookings: results.slice(0, MAX_RECOVERED), hasMore: results.length > MAX_RECOVERED });
}

export async function handleBookingSms(request: Request, payload: Record<string, unknown>, step: "start" | "check") {
  if (!adminTransport(request)) return respond({ error: "Xác minh số điện thoại yêu cầu kết nối HTTPS." }, 403);
  const config = smsConfig();
  if (!config) return respond({ error: "Website chưa cấu hình gửi OTP qua SMS.", code: "BOOKING_SMS_NOT_CONFIGURED" }, 503);
  const purpose = payload.purpose;
  if (purpose !== "booking" && purpose !== "recovery") return respond({ error: "Yêu cầu xác minh không hợp lệ." }, 400);
  return step === "start"
    ? startChallenge(request, config, purpose, payload.phone)
    : checkChallenge(request, config, purpose, payload.ticket, payload.otp);
}

export async function approvedBookingPhone(ticket: unknown, input: unknown) {
  const config = smsConfig();
  const phone = normalizeSmsPhone(input);
  if (!config || !phone || !validTicket(ticket)) return null;
  const hash = await ticketHash(config, ticket);
  const approval = await protectionSettings.DB.prepare(`SELECT ticket_hash FROM booking_sms_challenges
    WHERE ticket_hash = ? AND phone = ? AND purpose = 'booking' AND state = 'approved' AND expires_at > ?`)
    .bind(hash, phone, Date.now()).first();
  return approval ? { hash, phone } : null;
}
