import { waitUntil } from "cloudflare:workers";
import { reverseGeocode } from "../../../lib/reverse-geocode.mjs";
import { cleanBookingLocation } from "../../../public/location-utils.js";
import { summarizePayments, validateMoneySettings, validatePayment, validateVndAmount } from "../../../public/finance-utils.js";
import { and, asc, desc, eq, isNotNull, isNull, ne, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { appointments, bookingSmsChallenges, bookingVerifiedPhones, customers, paymentTransactions, scheduleSlots, services, siteContent } from "../../../db/schema";
import { privateHeaders, sameOrigin, siteAdmin } from "../../../lib/site-admin";
import { limitSensitiveRequest, readBoundedObject } from "../../../lib/data-guards";
import { appointmentTimeErrors, bookingAddressErrors, contactErrors, fieldFrom, formError, normalizePhone, samePhone, validEmail, validPhone } from "../../../lib/form-errors";
import { dataErrorMessage } from "../../../lib/data-errors.mjs";
import { bookingTimeError, validBookingDateTime } from "../../../lib/booking-validation.mjs";
import { approvedBookingPhone, bookingPhoneRequired, bookingSmsEnabled, handleBookingSms } from "../../../lib/booking-sms";
import { bookingGoogleEnabled, handleBookingGoogle } from "../../../lib/booking-google";
import { workReminders } from "../../../lib/work-reminders";
import { pushNewBooking } from "../../../lib/admin-web-push";

const initialServices = [
  { id: "personal", name: "Trang điểm cá nhân", duration: 60, price: 450000, description: "Tươi sáng, tự nhiên và phù hợp với phong cách hằng ngày.", enabled: true, contact: false, sortOrder: 1 },
  { id: "party", name: "Trang điểm dự tiệc", duration: 90, price: 650000, description: "Sắc nét vừa đủ, bền đẹp dưới nhiều điều kiện ánh sáng.", enabled: true, contact: false, sortOrder: 2 },
  { id: "photo", name: "Trang điểm chụp ảnh", duration: 120, price: 850000, description: "Tối ưu lớp nền, đường nét và màu sắc trước ống kính.", enabled: true, contact: false, sortOrder: 3 },
  { id: "bridal", name: "Trang điểm cô dâu", duration: 150, price: 0, description: "Thiết kế diện mạo, thử phong cách và đồng hành trong ngày cưới.", enabled: true, contact: true, sortOrder: 4 },
];

const initialBrand = {
  name: "HOÀN",
  role: "MAKEUP ARTIST",
  headline: "Vẻ đẹp không cần giống một ai.",
  description: "Mỗi diện mạo được thiết kế theo đường nét, phong cách và khoảnh khắc của riêng bạn.",
  imageMessage: "Mỗi diện mạo là một thiết kế dành riêng cho bạn.",
  phone: "",
  email: "",
  area: "Hà Nội",
  accent: "#7A1832",
};

const initialSettings = {
  autoConfirm: false,
  zaloReminder: true,
  emailReminder: true,
  bookingWindow: "60",
  deposit: "200000",
  timezone: "GMT+7",
  scheduleOpen: true,
  travelFee: "50000",
  bankName: "",
  bankAccount: "",
  bankOwner: "",
};

function messageFor(error: unknown) {
  return dataErrorMessage(error);
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function integer(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : fallback;
}

function configuredPaymentSettings(value: Record<string,unknown>) {
  // This exact tuple was shipped as starter content, not a verified bank
  // account. Keep other saved settings intact and require real configuration.
  if(text(value.bankAccount)==='0901234567'&&text(value.bankOwner)==='NGUYEN HOAN')return {...value,bankName:'',bankAccount:'',bankOwner:'',bankCode:''};
  return value;
}

function parseJson<T>(value: string | undefined, fallback: T): T {
  try {
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

async function ensureDefaults() {
  const db = getDb();
  const existingServices = await db.select({ id: services.id }).from(services).limit(1);
  if (!existingServices.length) await db.insert(services).values(initialServices).onConflictDoNothing();
  const contentRows = await db.select({ key: siteContent.key }).from(siteContent).where(sql`${siteContent.key} IN ('brand', 'settings')`);
  const keys = new Set(contentRows.map((row) => row.key));
  const missing = [
    !keys.has("brand") ? { key: "brand", value: JSON.stringify(initialBrand) } : null,
    !keys.has("settings") ? { key: "settings", value: JSON.stringify(initialSettings) } : null,
  ].filter(Boolean) as Array<{ key: string; value: string }>;
  if (missing.length) await db.insert(siteContent).values(missing).onConflictDoNothing();
}

function notificationValues(notification: Record<string, string>) {
  const id = "NT-" + crypto.randomUUID().slice(0, 8).toUpperCase();
  const record = { id, ...notification, status: "unread", createdAt: new Date().toISOString() };
  return { key: "notification:" + id, value: JSON.stringify(record), updatedAt: record.createdAt };
}

async function createNotification(db: ReturnType<typeof getDb>, notification: Record<string, string>) {
  await db.insert(siteContent).values(notificationValues(notification));
}

async function snapshot() {
  await ensureDefaults();
  const db = getDb();
  const [serviceRows, appointmentRows, customerRows, slotRows, contentRows, paymentRows] = await Promise.all([
    db.select().from(services).orderBy(asc(services.sortOrder)),
    db.select().from(appointments).where(isNull(appointments.archivedAt)).orderBy(desc(appointments.createdAt)),
    db.select().from(customers).orderBy(desc(customers.updatedAt)),
    db.select().from(scheduleSlots).orderBy(asc(scheduleSlots.slotDate), asc(scheduleSlots.slotTime)),
    db.select().from(siteContent),
    db.select().from(paymentTransactions).orderBy(desc(paymentTransactions.occurredAt),desc(paymentTransactions.createdAt)),
  ]);
  const content = Object.fromEntries(contentRows.map((row) => [row.key, row.value]));
  return {
    services: serviceRows,
    appointments: appointmentRows.map(appointment => ({...appointment,finance:summarizePayments(appointment,paymentRows)})),
    paymentTransactions: paymentRows,
    workReminders: workReminders(appointmentRows),
    customers: customerRows,
    scheduleSlots: slotRows,
    brand: parseJson(content.brand, initialBrand),
    settings: configuredPaymentSettings(parseJson(content.settings, initialSettings)),
    bookingDetails: Object.fromEntries(contentRows.filter(r=>r.key.startsWith("booking:")).map(r=>[r.key.slice(8), parseJson(r.value, {})])),
    requests: contentRows.filter(r=>r.key.startsWith("request:")).map(r=>parseJson<Record<string, unknown>>(r.value, {})).filter(record=>!record.archivedAt),
    notifications: contentRows.filter(r=>r.key.startsWith("notification:")).map(r=>parseJson(r.value, {})),
    serverTime: new Date().toISOString(),
  };
}

async function lookupBooking(code: string, phone: string) {
  if (!code || !phone || code.length > 60 || phone.length > 30) {
    return formError({
      ...(!code || code.length > 60 ? { code: "Vui lòng nhập mã lịch hẹn." } : {}),
      ...(!phone || phone.length > 30 ? { phone: "Vui lòng nhập số điện thoại đã dùng khi đặt lịch." } : {}),
    });
  }
  const db = getDb();
  const [appointment] = await db.select().from(appointments).where(and(eq(appointments.code, code), isNull(appointments.archivedAt))).limit(1);
  if (!appointment || !samePhone(appointment.phone, phone)) {
    return Response.json({ error: "Không tìm thấy lịch phù hợp." }, { status: 404, headers: privateHeaders });
  }
  const [details] = await db.select().from(siteContent).where(eq(siteContent.key, "booking:" + appointment.code)).limit(1);
  const [paymentSettingsRow] = await db.select().from(siteContent).where(eq(siteContent.key, "settings")).limit(1);
  const paymentSettings = configuredPaymentSettings(parseJson<Record<string,unknown>>(paymentSettingsRow?.value, initialSettings));
  const bookingDetails = parseJson<Record<string,unknown>>(details?.value, {});
  const paymentInstructions = {
    bankName: text(paymentSettings.bankName), bankAccount: text(paymentSettings.bankAccount), bankOwner: text(paymentSettings.bankOwner),
    bankCode: text(paymentSettings.bankCode), paymentQrUrl: text(paymentSettings.paymentQrUrl),
    depositRequired: Math.max(0, Math.min(appointment.total, integer(bookingDetails.depositRequired, integer(paymentSettings.deposit, 200000)))),
  };
  const rows = await db.select().from(paymentTransactions).where(eq(paymentTransactions.appointmentCode, appointment.code)).orderBy(desc(paymentTransactions.occurredAt));
  const { entries: _entries, ...finance } = summarizePayments(appointment, rows);
  return Response.json({
    appointment: { ...appointment, finance },
    paymentHistory: rows.map(({ kind, amount, occurredAt }) => ({ kind, amount, occurredAt })),
    bookingDetails, paymentInstructions,
  }, { headers: privateHeaders });
}

const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
const publicSettingKeys = ["bookingWindow", "deposit", "travelFee", "scheduleOpen", "timezone"] as const;

async function availableHours(date: string, serviceId: string) {
  if (!validBookingDateTime(date, "00:00") || !serviceId || serviceId.length > 100) {
    return Response.json({ error: "Ngày hoặc dịch vụ không hợp lệ." }, { status: 400, headers: privateHeaders });
  }
  const db = getDb();
  const [settingsRow] = await db.select().from(siteContent).where(eq(siteContent.key, "settings")).limit(1);
  const settings = parseJson<Record<string, unknown>>(settingsRow?.value, initialSettings);
  if (settings.scheduleOpen === false || bookingTimeError(date, "23:59", settings.bookingWindow ?? 60)) {
    return Response.json({ times: [] }, { headers: privateHeaders });
  }
  const [[selected], occupied, slots] = await Promise.all([
    db.select({ duration: services.duration }).from(services)
      .where(and(eq(services.id, serviceId), eq(services.enabled, true), eq(services.contact, false))).limit(1),
    db.all<{ starts: number; ends: number }>(sql`SELECT starts, ends FROM occupied_booking_intervals WHERE slot_date = ${date}`),
    db.select({ time: scheduleSlots.slotTime }).from(scheduleSlots).where(and(eq(scheduleSlots.slotDate, date), eq(scheduleSlots.status, "available"))),
  ]);
  if (!selected) return Response.json({ times: [] }, { headers: privateHeaders });
  const hours = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, "0") + ":00");
  const times = [...new Set([...hours, ...slots.map(slot => slot.time)])].sort().filter(time => {
    if (bookingTimeError(date, time, settings.bookingWindow ?? 60)) return false;
    const start = minutes(time);
    const end = start + selected.duration;
    return !occupied.some(interval => start < interval.ends && end > interval.starts);
  });
  return Response.json({ times }, { headers: privateHeaders });
}

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    if (params.has("code") || params.has("phone")) {
      return Response.json({ error: "Tải lại trang để tra cứu lịch bằng biểu mẫu bảo mật." }, { status: 405, headers: privateHeaders });
    }
    if (params.get("admin") === "1") {
      if (!await siteAdmin(request)) return Response.json({ error: "Cần đăng nhập quản trị." }, { status: 401, headers: privateHeaders });
      if (params.get("view") === "archive") {
        const db = getDb();
        const rawOffset = Number(params.get("offset"));
        const offset = Number.isFinite(rawOffset) ? Math.max(0, Math.min(100000, Math.trunc(rawOffset))) : 0;
        const rows = await db.select({ code: appointments.code, customer: appointments.customer, date: appointments.date, time: appointments.time, archivedAt: appointments.archivedAt })
          .from(appointments).where(isNotNull(appointments.archivedAt)).orderBy(desc(appointments.archivedAt), asc(appointments.code)).limit(26).offset(offset);
        return Response.json({ appointments: rows.slice(0, 25), hasNext: rows.length > 25 }, { headers: privateHeaders });
      }
      return Response.json(await snapshot(), { headers: privateHeaders });
    }
    if (params.has("availability")) {
      const limit = await limitSensitiveRequest(request, "availability");
      return limit || await availableHours(text(params.get("availability")), text(params.get("service")));
    }
    await ensureDefaults();
    const db = getDb();
    const [serviceRows, contentRows] = await Promise.all([
      db.select().from(services).where(eq(services.enabled, true)).orderBy(asc(services.sortOrder)),
      db.select().from(siteContent).where(sql`${siteContent.key} IN ('brand', 'settings')`),
    ]);
    const content = Object.fromEntries(contentRows.map(row => [row.key, row.value]));
    const settings = parseJson<Record<string, unknown>>(content.settings, initialSettings);
    return Response.json({
      services: serviceRows,
      brand: parseJson(content.brand, initialBrand),
      settings: {
        ...Object.fromEntries(publicSettingKeys.filter(key => Object.hasOwn(settings, key)).map(key => [key, settings[key]])),
        bookingSmsEnabled: bookingSmsEnabled(),
        bookingGoogleEnabled: bookingGoogleEnabled(),
      },
      serverTime: new Date().toISOString(),
    }, { headers: privateHeaders });
  } catch (error) {
    return Response.json({ error: messageFor(error) }, { status: 500, headers: privateHeaders });
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Nguồn yêu cầu không hợp lệ." }, { status: 403, headers: privateHeaders });
  try {
    let payload: Record<string, unknown>;
    try { payload = await readBoundedObject(request, 256 * 1024); }
    catch { return Response.json({ error: 'Dữ liệu yêu cầu không hợp lệ.' }, { status: 400, headers: privateHeaders }); }
    const action = text(payload.action);
    if (action === "reverseGeocode") return reverseGeocode(payload);
    if (action === "validateBookingLocation") {
      const fields = bookingAddressErrors(payload);
      return Object.keys(fields).length ? formError(fields) : Response.json({ ok: true }, { headers: privateHeaders });
    }
    if (action === "lookupBooking") {
      const limited = await limitSensitiveRequest(request, "appointment-access");
      return limited || await lookupBooking(text(payload.code).toUpperCase(), normalizePhone(payload.phone));
    }
    if (action === "startBookingOtp" || action === "verifyBookingOtp") {
      return await handleBookingSms(request, payload, action === "startBookingOtp" ? "start" : "check");
    }
    if (action === "startBookingGoogle" || action === "finishBookingGoogle") {
      return await handleBookingGoogle(request, payload, action === "startBookingGoogle" ? "start" : "finish");
    }
    if (action === "createRequest" && payload.purpose === "booking-code-recovery") {
      return Response.json({ error: "Trang lấy lại mã đã chuyển sang xác minh OTP. Vui lòng tải lại trang." }, { status: 410, headers: privateHeaders });
    }

    const adminActions = [
      "updateAppointment",
      "deleteAppointment",
      "archiveAppointment",
      "restoreAppointment",
      "setScheduleSlot",
      "saveContent",
      "saveService",
      "saveCustomer",
      "deleteService",
      "resolveRequest",
      "updateRequest",
      "deleteRequest",
      "markNotificationsRead",
      "recordPayment",
      "validateServicePack",
    ];
    if (adminActions.includes(action)) {
      if (!await siteAdmin(request)) {
        return Response.json({ error: "Yêu cầu quyền quản trị để thực hiện thao tác này." }, { status: 401, headers: privateHeaders });
      }
    }
    if (action === "validateServicePack") {
      const title = text(payload.title);
      if (!title) return formError({ title: "Vui lòng nhập tên gói dịch vụ." });
      if (title.length > 140) return formError({ title: "Tên gói dịch vụ tối đa 140 ký tự." });
      return Response.json({ ok: true }, { headers: privateHeaders });
    }
    if (action === "reportPayment" || (action === "createRequest" && text(payload.code))) {
      if (!await siteAdmin(request)) {
        const limited = await limitSensitiveRequest(request, "appointment-access");
        if (limited) return limited;
      }
    }
    if (action === "createAppointment" || (action === "createRequest" && !text(payload.code))) {
      const limited = await limitSensitiveRequest(request, "appointment-create");
      if (limited) return limited;
    }
    const db = getDb();
    await ensureDefaults();

    if (action === "createAppointment") {
      const customer = text(payload.customer);
      const phone = text(payload.phone).replace(/\s+/g, "");
      const email = text(payload.email);
      const serviceId = text(payload.serviceId);
      const date = text(payload.date);
      const time = text(payload.time);
      const adminBooking = await siteAdmin(request);
      const fields = { ...contactErrors(payload, "customer"), ...appointmentTimeErrors(date, time) };
      if (!adminBooking && !email) fields.email = "Vui lòng nhập địa chỉ email.";
      if (!serviceId) fields.serviceId = "Vui lòng chọn dịch vụ.";
      if (payload.form === "booking-info") {
        if (!text(payload.style)) fields.style = "Vui lòng chọn phong cách trang điểm.";
        if (payload.consent !== true) fields.consent = "Vui lòng đồng ý chính sách đặt lịch và bảo mật.";
        if (payload.locationType !== "artist") Object.assign(fields, bookingAddressErrors(payload));
      }
      if (Object.keys(fields).length) return formError(fields);
      const [selectedService] = await db.select().from(services).where(eq(services.id, serviceId)).limit(1);
      if (!selectedService?.enabled) return formError({ serviceId: "Dịch vụ hiện không khả dụng. Vui lòng chọn dịch vụ khác." });
      const [settingsRow] = await db.select().from(siteContent).where(eq(siteContent.key,"settings")).limit(1);
      const settings = parseJson<Record<string, unknown>>(settingsRow?.value, initialSettings);
      const timeError = bookingTimeError(date, time, settings.bookingWindow ?? 60);
      if (timeError) return formError({ time: timeError });
      if (settings.scheduleOpen === false) return Response.json({error:"Hiện đang tạm ngừng nhận lịch."},{status:409});
      const needsVerification = bookingSmsEnabled() && !adminBooking;
      const approval = needsVerification ? await approvedBookingPhone(payload.phoneProof, phone) : null;
      if (needsVerification && !approval) return bookingPhoneRequired();
      const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase();
      const [year, month, day] = date.split("-");
      const code = `HMA-${day}${month}${year.slice(-2)}-${suffix}`;
      const travelFee = payload.locationType === "artist" ? 0 : integer(settings.travelFee,50000);
      const total = selectedService.price + travelFee;
      const notification = notificationValues({
        type: "appointment.created",
        title: "Có lịch đặt mới",
        message: `${customer} đã đặt ${selectedService.name} vào ${date} lúc ${time}.`,
        entityType: "appointment",
        entityId: code,
      });

      const location = cleanBookingLocation(payload);
      const details = {skin:text(payload.skin),allergy:text(payload.allergy),allergyNote:text(payload.allergyNote),city:text(payload.city),locationNote:text(payload.locationNote),...location,travelFee,depositRequired:Math.min(total,integer(settings.deposit,200000)),references:Array.isArray(payload.references)?payload.references.filter(x=>typeof x==='string'&&/^\/api\/uploads\?key=/.test(x)).slice(0,3):[]};
      const verifiedPhoneWrites = approval ? [
        db.insert(bookingVerifiedPhones).values({
          appointmentCode: code,
          phone: sql`(SELECT phone FROM booking_sms_challenges WHERE ticket_hash = ${approval.hash}
            AND purpose = 'booking' AND state = 'approved' AND phone = ${approval.phone} AND expires_at > ${Date.now()})`,
          verifiedAt: Date.now(),
        }),
        db.delete(bookingSmsChallenges).where(eq(bookingSmsChallenges.ticketHash, approval.hash)),
      ] : [];
      try {
        const [[created]] = await db.batch([
          db.insert(appointments).values({
            code, customer, phone, email, serviceId, date, time,
            locationType: text(payload.locationType, "client"), address: text(payload.address),
            district: text(payload.district), ward: text(payload.ward), style: text(payload.style),
            note: text(payload.note), total, deposit: 0, paymentStatus: "unverified", status: "pending",
          }).returning(),
          db.insert(siteContent).values({ key: "booking:" + code, value: JSON.stringify(details) }),
          db.insert(customers).values({ name: customer, phone, email, visits: 1 })
            .onConflictDoUpdate({ target: customers.phone, set: { visits: sql`${customers.visits} + 1`, updatedAt: new Date().toISOString() } }),
          db.insert(siteContent).values(notification),
          ...verifiedPhoneWrites,
        ]);
        waitUntil(pushNewBooking(code, notification.updatedAt).catch(() => {
          console.warn("HOAN Web Push will retry the booking notice");
        }));
        return Response.json({ appointment: created }, { status: 201, headers: privateHeaders });
      } catch (error) {
        const message = messageFor(error);
        if (message.startsWith("Khung giờ đã có lịch")) return Response.json({ error: message }, { status: 409, headers: privateHeaders });
        if (approval && !await approvedBookingPhone(payload.phoneProof, phone)) return bookingPhoneRequired();
        throw error;
      }
    }

    if (action === "recordPayment") {
      let values;
      try { values = validatePayment(payload); }
      catch (error) {
        const field = fieldFrom(error);
        return field ? formError({ [field]: messageFor(error) }) : Response.json({ error: messageFor(error) }, { status: 400, headers: privateHeaders });
      }
      const code=text(payload.code);
      const reviewVersion = payload.depositReportVersion === undefined ? undefined : text(payload.depositReportVersion);
      if (reviewVersion !== undefined && (!reviewVersion || reviewVersion.length > 64 || values.kind !== "deposit")) {
        return Response.json({ error: "Yêu cầu duyệt cọc không hợp lệ." }, { status: 400, headers: privateHeaders });
      }
      const [current]=await db.select().from(appointments).where(eq(appointments.code,code)).limit(1);
      if(!current)return Response.json({error:"Không tìm thấy lịch hẹn."},{status:404});
      const existing=async()=>{const [row]=await db.select().from(paymentTransactions).where(eq(paymentTransactions.idempotencyKey,values.idempotencyKey)).limit(1);return row;};
      let transaction=await existing();
      const matches=(row:typeof paymentTransactions.$inferSelect)=>row.appointmentCode===code&&row.kind===values.kind&&row.amount===values.amount&&row.method===values.method&&row.reference===values.reference&&row.occurredAt===values.occurredAt&&row.note===values.note&&row.confirmAppointment===values.confirmAppointment;
      if(transaction&&!matches(transaction))return Response.json({error:"Mã yêu cầu đã dùng cho giao dịch khác. Hãy mở lại biểu mẫu."},{status:409});
      let createdTransaction=false;
      if(!transaction){
        if(values.method==='bank'){
          const [duplicate]=await db.select({id:paymentTransactions.id}).from(paymentTransactions).where(and(eq(paymentTransactions.method,'bank'),sql`lower(trim(${paymentTransactions.reference}))=lower(trim(${values.reference}))`)).limit(1);
          if(duplicate){
            // A concurrent retry may have committed after the first lookup.
            const replay=await existing();
            if(replay&&matches(replay))transaction=replay;
            else return Response.json({error:'Mã giao dịch ngân hàng đã được ghi nhận. Nhập mã riêng của lần chuyển tiền này, không phải tên ngân hàng.'},{status:409});
          }
        }
        if(!transaction){
          try{
            const id = 'TX-' + crypto.randomUUID();
            const createdAt = new Date().toISOString();
            const insert = db.insert(paymentTransactions);
            const rows = reviewVersion === undefined
              ? await insert.values({ id, appointmentCode: code, ...values, createdAt }).returning()
              : await insert.select(sql`
                  SELECT ${id}, code, ${values.kind}, ${values.amount}, ${values.method}, ${values.reference}, ${values.note},
                    ${values.occurredAt}, ${createdAt}, ${values.idempotencyKey}, ${Number(values.confirmAppointment)}
                  FROM appointments
                  WHERE code = ${code} AND archived_at IS NULL AND status IN ('pending', 'confirmed')
                    AND updated_at = ${reviewVersion}
                    AND (payment_status = 'pending_verification' OR (
                      status = 'pending' AND payment_status = 'received' AND deposit > 0 AND deposit < MIN(total,
                        COALESCE((SELECT CAST(json_extract(value, '$.depositRequired') AS INTEGER) FROM site_content WHERE key = 'booking:' || appointments.code),
                          (SELECT CAST(json_extract(value, '$.deposit') AS INTEGER) FROM site_content WHERE key = 'settings'), 200000))
                    ))
                `).returning();
            [transaction] = rows;
            if (!transaction) {
              return Response.json({ error: "Báo cọc đã thay đổi. Mở lại danh sách để kiểm tra." }, { status: 409, headers: privateHeaders });
            }
            createdTransaction=true;
          }catch(error){
            // Concurrent retries share the same idempotency key. The trigger and
            // unique constraints keep both overdrafts and duplicate writes atomic.
            transaction=await existing();
            if(!transaction||!matches(transaction))return Response.json({error:messageFor(error)},{status:409});
          }
        }
      }
      const [appointment]=await db.select().from(appointments).where(eq(appointments.code,code)).limit(1);
      const rows=await db.select().from(paymentTransactions).where(eq(paymentTransactions.appointmentCode,code));
      if(createdTransaction){try{await createNotification(db,{type:'payment.recorded',title:values.kind==='refund'?'Đã ghi sổ hoàn tiền':'Đã ghi sổ thu tiền',message:`${code}: ${values.amount.toLocaleString('vi-VN')}đ · ${values.kind==='refund'?'Hoàn tiền':values.kind==='deposit'?'Thu cọc':'Thu tiền còn lại'}`,entityType:'appointment',entityId:code});}catch{/* A notification failure must not turn a committed payment into a failed receipt. */}}
      return Response.json({transaction,appointment:{...appointment,finance:summarizePayments(appointment,rows)},replayed:!createdTransaction},{status:createdTransaction?201:200,headers:{'Cache-Control':'no-store'}});
    }

    if (action === "updateAppointment") {
      const code = text(payload.code);
      if (!code) return Response.json({ error: "Thiếu mã lịch hẹn." }, { status: 400 });
      const reviewVersion = payload.expectedUpdatedAt === undefined ? undefined : text(payload.expectedUpdatedAt);
      if (reviewVersion !== undefined && (!reviewVersion || reviewVersion.length > 64)) {
        return Response.json({ error: "Hồ sơ duyệt không hợp lệ." }, { status: 400, headers: privateHeaders });
      }
      const allowedStatus = ["pending", "confirmed", "completed", "cancelled"];
      if (reviewVersion !== undefined && !["confirmed", "cancelled"].includes(text(payload.status))) {
        return Response.json({ error: "Thao tác duyệt không hợp lệ." }, { status: 400, headers: privateHeaders });
      }
      const changes: Record<string, string | number> = { updatedAt: new Date().toISOString() };
      if (allowedStatus.includes(text(payload.status))) changes.status = text(payload.status);
      if (/^\d{4}-\d{2}-\d{2}$/.test(text(payload.date))) changes.date = text(payload.date);
      if (/^\d{2}:\d{2}$/.test(text(payload.time))) changes.time = text(payload.time);
      if (payload.customer) changes.customer = text(payload.customer);
      if (payload.phone) changes.phone = text(payload.phone);
      if (payload.serviceId) changes.serviceId = text(payload.serviceId);
      if (payload.address !== undefined) changes.address = text(payload.address);
      if (payload.district !== undefined) changes.district = text(payload.district);
      if (payload.note !== undefined) changes.note = text(payload.note);
      if (payload.style !== undefined) changes.style = text(payload.style);
      if (payload.total !== undefined) {
        try{changes.total=validateVndAmount(payload.total,'Tổng chi phí');}catch(error){return formError({ total: messageFor(error) });}
      }

      const [current] = await db.select().from(appointments).where(and(eq(appointments.code,code), isNull(appointments.archivedAt))).limit(1);
      if (current) {
        const fields = appointmentTimeErrors(payload.date ?? current.date, payload.time ?? current.time);
        if (payload.customer !== undefined && !text(payload.customer)) fields.customer = "Vui lòng nhập họ và tên.";
        if (payload.phone !== undefined && !validPhone(payload.phone)) fields.phone = "Nhập số điện thoại hợp lệ.";
        if (Object.keys(fields).length) return formError(fields);
      }
      if (current && (payload.date !== undefined || payload.time !== undefined)) {
        const [row] = await db.select().from(siteContent).where(eq(siteContent.key,'settings')).limit(1);
        const error = bookingTimeError(text(payload.date,current.date),text(payload.time,current.time),parseJson<Record<string,unknown>>(row?.value,initialSettings).bookingWindow ?? 60);
        if (error) return formError({ time: error });
      }
      if (!current) return Response.json({error:"Không tìm thấy lịch hẹn."},{status:404});
      const nextStatus = text(payload.status);
      if (nextStatus === "completed" && current.status !== "confirmed") return Response.json({ error: "Chỉ lịch đã xác nhận mới được đánh dấu hoàn thành." }, { status: 409 });
      if (current.status === "completed" && nextStatus && nextStatus !== "completed") return Response.json({ error: "Lịch đã hoàn thành không thể quay về trạng thái khác." }, { status: 409 });
      if (current.status === "cancelled" && nextStatus && nextStatus !== "cancelled") return Response.json({ error: "Lịch đã hủy không thể mở lại từ thao tác này." }, { status: 409 });
      if (changes.date || changes.time) {
        const nextDate=String(changes.date||current.date), nextTime=String(changes.time||current.time);
        const rows=await db.select().from(appointments).where(and(eq(appointments.date,nextDate),isNull(appointments.archivedAt),ne(appointments.status,'cancelled'),ne(appointments.status,'completed'),ne(appointments.code,code)));
        const serviceRows=await db.select().from(services);
        const sid = String(changes.serviceId || current.serviceId);
        const minutes=(t:string)=>Number(t.slice(0,2))*60+Number(t.slice(3));
        const start=minutes(nextTime),end=start+(serviceRows.find(s=>s.id===sid)?.duration||90);
        if(rows.some(a=>start<minutes(a.time)+(serviceRows.find(s=>s.id===a.serviceId)?.duration||90)&&end>minutes(a.time)))return Response.json({error:'Thời gian mới trùng một lịch khác.'},{status:409});
      }
      const newTotal = changes.total !== undefined ? integer(changes.total) : current.total;
      if(newTotal<current.deposit)return Response.json({error:"Tổng chi phí không được thấp hơn số tiền thực còn giữ."},{status:409});
      if(payload.deposit!==undefined&&Number(payload.deposit)!==current.deposit)return Response.json({error:"Ghi nhận thu hoặc hoàn tiền trong sổ giao dịch; không sửa trực tiếp số tiền đã nhận."},{status:409});
      if(payload.paymentStatus!==undefined&&text(payload.paymentStatus)!==current.paymentStatus&&current.deposit>0)return Response.json({error:"Trạng thái thanh toán được tính từ sổ giao dịch."},{status:409});
      if(text(payload.paymentStatus)==='received'&&current.deposit===0)return Response.json({error:"Hãy ghi nhận giao dịch thu tiền trước khi đánh dấu đã nhận."},{status:409});
      if (current.deposit===0&&payload.paymentStatus !== undefined && ["pending_verification", "unverified"].includes(text(payload.paymentStatus))) {
        changes.paymentStatus = text(payload.paymentStatus);
      }
      if(text(payload.refundStatus)==='paid'&&current.refundStatus!=='paid')return Response.json({error:"Ghi nhận giao dịch hoàn tiền để cập nhật số tiền và trạng thái đã hoàn."},{status:409});
      if(payload.refundStatus!==undefined&&(['partial','paid'].includes(current.refundStatus)||text(payload.refundStatus)==='partial')&&text(payload.refundStatus)!==current.refundStatus)return Response.json({error:"Trạng thái tiền đã hoàn được tính từ sổ giao dịch, không thể sửa trực tiếp."},{status:409});
      if (payload.refundStatus !== undefined && ["none", "pending", "approved", "paid", "rejected"].includes(text(payload.refundStatus))) {
        changes.refundStatus = text(payload.refundStatus);
      }
      if (payload.refundNote !== undefined) changes.refundNote = text(payload.refundNote).slice(0, 1000);
      if (nextStatus === "cancelled" && current.deposit > 0 && !payload.refundStatus) changes.refundStatus = "pending";
      const [updated] = await db.update(appointments).set(changes).where(and(
        eq(appointments.code, code), isNull(appointments.archivedAt),
        reviewVersion === undefined ? undefined : and(eq(appointments.status, "pending"), eq(appointments.updatedAt, reviewVersion))
      )).returning();
      if (!updated && reviewVersion !== undefined) {
        return Response.json({ error: "Lịch đã thay đổi. Mở lại để kiểm tra." }, { status: 409, headers: privateHeaders });
      }
      if (!updated) return Response.json({ error: "Không tìm thấy lịch hẹn." }, { status: 404 });
      if (nextStatus && nextStatus !== current.status) {
        const statusLabels: Record<string, string> = { pending: "chờ xác nhận", confirmed: "đã xác nhận", completed: "đã hoàn thành", cancelled: "đã hủy" };
        await createNotification(db, {
          type: "appointment.status",
          title: "Trạng thái lịch đã thay đổi",
          message: `Lịch ${code} của ${updated.customer} ${statusLabels[nextStatus] || nextStatus}.`,
          entityType: "appointment",
          entityId: code,
        });
      }
      if (changes.refundStatus && changes.refundStatus !== current.refundStatus) {
        const refundLabels: Record<string, string> = { pending: "đang chờ hoàn", approved: "đã được duyệt hoàn", paid: "đã hoàn tiền", rejected: "bị từ chối hoàn" };
        await createNotification(db, {
          type: "payment.refund",
          title: "Trạng thái hoàn cọc đã thay đổi",
          message: `Khoản cọc của lịch ${code} ${refundLabels[String(changes.refundStatus)] || changes.refundStatus}.`,
          entityType: "appointment",
          entityId: code,
        });
      }
      return Response.json({ appointment: updated });
    }

    if (action === "archiveAppointment" || action === "deleteAppointment") {
      const code = text(payload.code);
      if (!code) return Response.json({ error: "Thiếu mã lịch hẹn." }, { status: 400 });
      const [row] = await db.update(appointments).set({ archivedAt: new Date().toISOString() }).where(and(
        eq(appointments.code, code), isNull(appointments.archivedAt), eq(appointments.deposit, 0), ne(appointments.paymentStatus, "pending_verification"),
        sql`NOT EXISTS (SELECT 1 FROM payment_transactions WHERE appointment_code = ${code})`,
      )).returning({ code: appointments.code });
      if (!row) return Response.json({ error: "Lịch đã lưu trữ, không còn khả dụng hoặc có giao dịch cần giữ để đối soát." }, { status: 409, headers: privateHeaders });
      return Response.json({ ok: true }, { headers: privateHeaders });
    }

    if (action === "restoreAppointment") {
      const code = text(payload.code);
      try {
        const [row] = await db.update(appointments).set({ archivedAt: null, updatedAt: new Date().toISOString() })
          .where(and(eq(appointments.code, code), isNotNull(appointments.archivedAt))).returning({ code: appointments.code });
        if (!row) return Response.json({ error: "Không tìm thấy lịch đã lưu trữ." }, { status: 404, headers: privateHeaders });
        return Response.json({ ok: true }, { headers: privateHeaders });
      } catch (error) {
        return Response.json({ error: messageFor(error) }, { status: 409, headers: privateHeaders });
      }
    }

    if (action === "reportPayment") {
      const code=text(payload.code);
      const phone = normalizePhone(payload.phone);
      const [a]=await db.select().from(appointments).where(and(eq(appointments.code,code), isNull(appointments.archivedAt))).limit(1);
      if (!a || a.status === "cancelled" || (!await siteAdmin(request) && !samePhone(a.phone, phone))) {
        return Response.json({ error: "Mã lịch hoặc số điện thoại không khớp." }, { status: 404, headers: privateHeaders });
      }
      const paymentContent=await db.select().from(siteContent).where(sql`${siteContent.key} IN (${'booking:'+code},'settings')`);
      const detail=parseJson<Record<string,unknown>>(paymentContent.find(row=>row.key==='booking:'+code)?.value,{});
      const setting=parseJson<Record<string,unknown>>(paymentContent.find(row=>row.key==='settings')?.value,initialSettings);
      const needed=Math.max(0,Math.min(a.total,integer(detail.depositRequired,integer(setting.deposit,200000))));
      if (a.paymentStatus === "pending_verification" || needed === 0 || a.deposit > 0) {
        return Response.json({ appointment: a }, { headers: privateHeaders });
      }
      const stillEligible = and(eq(appointments.code, code), isNull(appointments.archivedAt), ne(appointments.status, "cancelled"));
      const [appointment] = await db.update(appointments).set({ paymentStatus: "pending_verification", updatedAt: new Date().toISOString() })
        .where(and(stillEligible, eq(appointments.deposit, 0), eq(appointments.paymentStatus, "unverified"))).returning();
      if (!appointment) {
        const [current] = await db.select().from(appointments).where(stillEligible).limit(1);
        if (current) return Response.json({ appointment: current }, { headers: privateHeaders });
        return Response.json({ error: "Mã lịch hoặc số điện thoại không khớp." }, { status: 404, headers: privateHeaders });
      }
      await createNotification(db, {
        type: "payment.reported",
        title: "Khách báo đã chuyển cọc",
        message: `Lịch ${code} đang chờ kiểm tra giao dịch và xác nhận tiền cọc.`,
        entityType: "appointment",
        entityId: code,
      });
      return Response.json({ appointment }, { headers: privateHeaders });
    }
    if (action === "markNotificationsRead") {
      const notificationId = text(payload.id);
      const rows = await db.select().from(siteContent);
      const targets = rows.filter(row => row.key.startsWith("notification:") && (!notificationId || row.key === "notification:" + notificationId));
      for (const row of targets) {
        const notification = parseJson<Record<string, unknown>>(row.value, {});
        if (notification.status === "unread") {
          await db.update(siteContent).set({ value: JSON.stringify({ ...notification, status: "read", readAt: new Date().toISOString() }), updatedAt: new Date().toISOString() }).where(eq(siteContent.key, row.key));
        }
      }
      return Response.json({ ok: true, count: targets.length });
    }
    if (action === "createRequest") {
      const code = text(payload.code);
      const subject = text(payload.subject);
      const message = text(payload.message);
      const verifiedPhone = normalizePhone(payload.phone);
      const [a]=code?await db.select().from(appointments).where(and(eq(appointments.code,code), isNull(appointments.archivedAt))).limit(1):[];
      if (code && (!a || (!await siteAdmin(request) && !samePhone(a.phone, verifiedPhone)))) {
        return Response.json({ error: 'Mã lịch hoặc số điện thoại không khớp.' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
      }
      const name = text(payload.name) || a?.customer || '';
      const phone = text(payload.phone) || a?.phone || '';
      const fields = contactErrors({ ...payload, name, phone }, "name");
      if (!subject) fields.subject = "Vui lòng chọn hoặc nhập chủ đề.";
      if (!message) fields.message = "Vui lòng nhập lời nhắn.";
      else if (message.length > 4000) fields.message = "Lời nhắn tối đa 4.000 ký tự.";
      if (payload.date !== undefined || payload.time !== undefined) {
        Object.assign(fields, appointmentTimeErrors(payload.date, payload.time));
        if (Object.keys(fields).length) return formError(fields);
        const [row] = await db.select().from(siteContent).where(eq(siteContent.key,'settings')).limit(1);
        const error = bookingTimeError(text(payload.date),text(payload.time),parseJson<Record<string,unknown>>(row?.value,initialSettings).bookingWindow ?? 60);
        if (error) return formError({ time: error });
      }
      if (Object.keys(fields).length) return formError(fields);
      const id = 'YC-' + crypto.randomUUID().slice(0, 8).toUpperCase();
      const record = {
        id, kind: code ? 'appointment' : 'consultation', code, name, phone, email: text(payload.email), subject, message,
        date: text(payload.date), time: text(payload.time), status: 'pending', createdAt: new Date().toISOString(), reply: '',
      };
      const notification = notificationValues({
        type: code ? "appointment.request" : "consultation.created",
        title: code ? "Có yêu cầu từ lịch hẹn" : "Có yêu cầu tư vấn mới",
        message: code ? `${name} gửi yêu cầu cho lịch ${code}.` : `${name} gửi yêu cầu tư vấn: ${subject}.`,
        entityType: "request",
        entityId: id,
      });
      await db.insert(siteContent).values([
        { key: 'request:' + id, value: JSON.stringify(record) },
        notification,
      ]);
      return Response.json({request:{id:record.id,status:record.status}},{status:201,headers:{'Cache-Control':'no-store'}});
    }
    if (action === "resolveRequest" || action === "updateRequest") {
      const id = text(payload.id);
      const key = 'request:' + id;
      const [row] = await db.select().from(siteContent).where(eq(siteContent.key, key)).limit(1);
      if (!row) return Response.json({ error: 'Không tìm thấy yêu cầu.' }, { status: 404 });
      const current = parseJson<Record<string, unknown>>(row.value, {});
      if (current.archivedAt) return Response.json({ error: "Yêu cầu đã được lưu trữ." }, { status: 409, headers: privateHeaders });
      if (["name", "phone", "email", "subject", "message"].some(key => payload[key] !== undefined)) {
        const updatedContact = { ...current, ...payload };
        const fields = contactErrors(updatedContact, "name");
        if (!text(updatedContact.subject)) fields.subject = "Vui lòng nhập chủ đề.";
        if (!text(updatedContact.message)) fields.message = "Vui lòng nhập lời nhắn.";
        if (Object.keys(fields).length) return formError(fields);
      }
      const status = text(payload.status) || (text(current.status) || 'pending');
      const reply = payload.reply !== undefined ? text(payload.reply) : (text(current.reply) || '');
      const record = {
        ...current,
        ...(payload.name !== undefined ? { name: text(payload.name) } : {}),
        ...(payload.phone !== undefined ? { phone: text(payload.phone) } : {}),
        ...(payload.email !== undefined ? { email: text(payload.email) } : {}),
        ...(payload.subject !== undefined ? { subject: text(payload.subject) } : {}),
        ...(payload.message !== undefined ? { message: text(payload.message) } : {}),
        status,
        reply,
        resolvedAt: status === 'resolved' ? (current.resolvedAt || new Date().toISOString()) : (status === 'pending' ? '' : current.resolvedAt),
        updatedAt: new Date().toISOString(),
      };
      const requestedDate = text(current.date);
      const requestedTime = text(current.time);
      const isReschedule = Boolean(current.code) && /đổi lịch|đổi ngày|reschedule/i.test(text(current.subject));
      if (action === "resolveRequest" && status === "resolved" && isReschedule && requestedDate && requestedTime) {
        const [settingsRow] = await db.select().from(siteContent).where(eq(siteContent.key,'settings')).limit(1);
        const timeError = bookingTimeError(requestedDate,requestedTime,parseJson<Record<string,unknown>>(settingsRow?.value,initialSettings).bookingWindow ?? 60);
        if (timeError) return Response.json({error:timeError},{status:400});
        const code = text(current.code);
        const [appointment] = await db.select().from(appointments).where(and(eq(appointments.code, code), isNull(appointments.archivedAt))).limit(1);
        if (!appointment || appointment.status === "cancelled" || appointment.status === "completed") {
          return Response.json({ error: "Lịch hẹn không còn đủ điều kiện để đổi lịch." }, { status: 409 });
        }
        const [serviceRows, conflictRows, blockedRows] = await Promise.all([
          db.select().from(services),
          db.select().from(appointments).where(and(
            eq(appointments.date, requestedDate),
            isNull(appointments.archivedAt),
            ne(appointments.code, code),
            ne(appointments.status, "cancelled"),
            ne(appointments.status, "completed"),
          )),
          db.select().from(scheduleSlots).where(and(eq(scheduleSlots.slotDate, requestedDate), eq(scheduleSlots.status, "blocked"))),
        ]);
        const minutes = (value: string) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
        const start = minutes(requestedTime);
        const duration = serviceRows.find(service => service.id === appointment.serviceId)?.duration || 90;
        const end = start + duration;
        const busy = conflictRows.some(row => {
          const rowStart = minutes(row.time);
          const rowDuration = serviceRows.find(service => service.id === row.serviceId)?.duration || 90;
          return start < rowStart + rowDuration && end > rowStart;
        });
        const blocked = blockedRows.some(row => {
          const slotStart = minutes(row.slotTime);
          return slotStart >= start && slotStart < end;
        });
        if (busy || blocked) return Response.json({ error: "Ngày giờ mới không còn trống." }, { status: 409 });
        await db.update(appointments).set({ date: requestedDate, time: requestedTime, updatedAt: new Date().toISOString() }).where(and(eq(appointments.code, code), isNull(appointments.archivedAt)));
      }
      await db.update(siteContent).set({ value: JSON.stringify(record), updatedAt: new Date().toISOString() }).where(eq(siteContent.key, key));
      return Response.json({ request: record });
    }
    if (action === "deleteRequest") {
      const id = text(payload.id);
      const key = 'request:' + id;
      await db.update(siteContent).set({
        value: sql`json_set(${siteContent.value}, '$.archivedAt', ${new Date().toISOString()})`,
        updatedAt: new Date().toISOString(),
      }).where(eq(siteContent.key, key));
      return Response.json({ ok: true });
    }
    if (action === "setScheduleSlot") {
      const slotDate = text(payload.date);
      const slotTime = text(payload.time);
      const status = text(payload.status, "available");
      const fields = appointmentTimeErrors(slotDate, slotTime);
      if (!["available", "blocked", "break", "travel"].includes(status)) fields.status = "Vui lòng chọn loại khung giờ.";
      const endTime = payload.endTime === undefined ? undefined : text(payload.endTime);
      if (endTime !== undefined && (!validBookingDateTime(slotDate, endTime) || endTime <= slotTime)) fields.endTime = "Giờ kết thúc phải sau giờ bắt đầu.";
      if (Object.keys(fields).length) return formError(fields);
      const [slot] = await db.insert(scheduleSlots).values({ slotDate, slotTime, status, endTime, note: text(payload.note) })
        .onConflictDoUpdate({
          target: [scheduleSlots.slotDate, scheduleSlots.slotTime],
          set: { status, note: text(payload.note), updatedAt: new Date().toISOString(), ...(endTime === undefined ? {} : { endTime }) },
        }).returning();
      return Response.json({ ok: true, slot }, { headers: privateHeaders });
    }

    if (action === "saveContent") {
      const key = text(payload.key);
      if (!["brand", "settings"].includes(key) || typeof payload.value !== "object" || !payload.value || Array.isArray(payload.value)) {
        return Response.json({ error: "Nội dung không hợp lệ." }, { status: 400 });
      }
      if(key==='settings'){
        try { validateMoneySettings(payload.value); }
        catch (error) { return formError({ [fieldFrom(error) || "deposit"]: messageFor(error) }); }
        const windowDays = Number((payload.value as Record<string,unknown>).bookingWindow ?? 60);
        if (!Number.isInteger(windowDays) || windowDays < 1 || windowDays > 3650) return formError({ bookingWindow: "Số ngày mở lịch phải là số nguyên từ 1 đến 3650." });
      } else {
        const brand = payload.value as Record<string,unknown>;
        if (text(brand.email) && !validEmail(brand.email)) return formError({ email: "Nhập email liên hệ hợp lệ." });
      }
      await db.insert(siteContent).values({ key, value: JSON.stringify(payload.value) })
        .onConflictDoUpdate({ target: siteContent.key, set: { value: JSON.stringify(payload.value), updatedAt: new Date().toISOString() } });
      return Response.json({ ok: true });
    }

    if (action === "saveCustomer") {
      const name = text(payload.name);
      const note = text(payload.note);
      const fields = payload.id === undefined ? contactErrors(payload, "name") : {};
      if (!name) fields.name = "Vui lòng nhập họ và tên.";
      else if (name.length > 120) fields.name = "Họ tên tối đa 120 ký tự.";
      if (note.length > 1000) fields.note = "Ghi chú tối đa 1.000 ký tự.";
      if (Object.keys(fields).length) return formError(fields);

      const values = { name, note, updatedAt: new Date().toISOString() };
      if (payload.id !== undefined) {
        const id = Number(payload.id);
        if (!Number.isSafeInteger(id) || id < 1) return formError({ name: "Hồ sơ khách hàng không hợp lệ." });
        const [saved] = await db.update(customers).set(values).where(eq(customers.id, id)).returning();
        if (!saved) return Response.json({ error: "Không tìm thấy khách hàng." }, { status: 404, headers: privateHeaders });
        return Response.json({ customer: saved }, { headers: privateHeaders });
      }

      const [saved] = await db.insert(customers)
        .values({ ...values, phone: normalizePhone(payload.phone), email: text(payload.email) })
        .onConflictDoNothing({ target: customers.phone }).returning();
      if (!saved) return formError({ phone: "Số điện thoại này đã có hồ sơ khách hàng." }, 409);
      return Response.json({ customer: saved }, { status: 201, headers: privateHeaders });
    }

    if (action === "saveService") {
      const id = text(payload.id) || `service-${Date.now()}`;
      if(payload.price!==undefined){try{validateVndAmount(payload.price,'Giá dịch vụ');}catch(error){return formError({ price: messageFor(error) });}}
      const duration = payload.duration === undefined ? 60 : Number(payload.duration);
      if (!Number.isInteger(duration) || duration < 1 || duration > 1440) return formError({ duration: "Thời lượng dịch vụ phải từ 1 đến 1.440 phút." });
      const values = {
        id,
        name: text(payload.name),
        duration,
        price: integer(payload.price),
        description: text(payload.description),
        enabled: payload.enabled !== false,
        contact: payload.contact === true,
        sortOrder: integer(payload.sortOrder, 99),
        updatedAt: new Date().toISOString(),
      };
      if (!values.name) return formError({ name: "Vui lòng nhập tên dịch vụ." });
      const [saved] = await db.insert(services).values(values)
        .onConflictDoUpdate({ target: services.id, set: values }).returning();
      return Response.json({ service: saved });
    }

    if (action === "deleteService") {
      const id = text(payload.id);
      const linked = await db.select({ code: appointments.code }).from(appointments).where(eq(appointments.serviceId, id)).limit(1);
      if (linked.length) return Response.json({ error: "Không thể xóa dịch vụ đã có lịch hẹn. Hãy tắt hiển thị dịch vụ." }, { status: 409 });
      await db.delete(services).where(eq(services.id, id));
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Thao tác không được hỗ trợ." }, { status: 400 });
  } catch (error) {
    const message = messageFor(error);
    return Response.json({ error: message }, { status: message.startsWith("Khung giờ đã có lịch") ? 409 : 500, headers: privateHeaders });
  }
}
