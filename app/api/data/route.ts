import { and, asc, desc, eq, ne, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { appointments, customers, scheduleSlots, services, siteContent } from "../../../db/schema";
import { siteAdmin } from "../../../lib/site-admin";

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
  bankName: "MB Bank (Ngân hàng Quân Đội)",
  bankAccount: "0901234567",
  bankOwner: "NGUYEN HOAN",
};

function messageFor(error: unknown) {
  const message = error instanceof Error ? error.message : "Lỗi không xác định";
  return message.includes("no such table")
    ? "Cơ sở dữ liệu chưa được khởi tạo. Hãy triển khai migration rồi thử lại."
    : message;
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function integer(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : fallback;
}

function parseJson<T>(value: string | undefined, fallback: T): T {
  try {
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

const initialAppointments: Array<typeof appointments.$inferInsert> = [];

const initialScheduleSlots: Array<typeof scheduleSlots.$inferInsert> = [];

async function ensureDefaults() {
  const db = getDb();
  const existingServices = await db.select({ id: services.id }).from(services).limit(1);
  if (!existingServices.length) await db.insert(services).values(initialServices);

  const contentRows = await db.select().from(siteContent);
  const keys = new Set(contentRows.map((row) => row.key));
  const missing = [
    !keys.has("brand") ? { key: "brand", value: JSON.stringify(initialBrand) } : null,
    !keys.has("settings") ? { key: "settings", value: JSON.stringify(initialSettings) } : null,
  ].filter(Boolean) as Array<{ key: string; value: string }>;
  if (missing.length) await db.insert(siteContent).values(missing);

  // Remove only explicitly known legacy test appointment codes.
  try {
    for (const code of ['HMA-090926-BQ0', 'HMA-090926-MQ3', 'HMA-100926-MS7', 'HMA-090926-BIQ', 'HMA-180926-6W2']) {
      await db.delete(appointments).where(eq(appointments.code, code));
    }
  } catch { /* ignore */ }

}

async function createNotification(db: ReturnType<typeof getDb>, notification: Record<string, string>) {
  const id = "NT-" + crypto.randomUUID().slice(0, 8).toUpperCase();
  const record = { id, ...notification, status: "unread", createdAt: new Date().toISOString() };
  await db.insert(siteContent).values({ key: "notification:" + id, value: JSON.stringify(record), updatedAt: record.createdAt });
}

async function snapshot() {
  await ensureDefaults();
  const db = getDb();
  const [serviceRows, appointmentRows, customerRows, slotRows, contentRows] = await Promise.all([
    db.select().from(services).orderBy(asc(services.sortOrder)),
    db.select().from(appointments).orderBy(desc(appointments.createdAt)),
    db.select().from(customers).orderBy(desc(customers.updatedAt)),
    db.select().from(scheduleSlots).orderBy(asc(scheduleSlots.slotDate), asc(scheduleSlots.slotTime)),
    db.select().from(siteContent),
  ]);
  const content = Object.fromEntries(contentRows.map((row) => [row.key, row.value]));
  return {
    services: serviceRows,
    appointments: appointmentRows,
    customers: customerRows,
    scheduleSlots: slotRows,
    brand: parseJson(content.brand, initialBrand),
    settings: (() => {
      const s = parseJson(content.settings, initialSettings);
      if (!s.bankName) s.bankName = "MB Bank (Ngân hàng Quân Đội)";
      if (!s.bankAccount) s.bankAccount = "0901234567";
      if (!s.bankOwner) s.bankOwner = "NGUYEN HOAN";
      return s;
    })(),
    bookingDetails: Object.fromEntries(contentRows.filter(r=>r.key.startsWith("booking:")).map(r=>[r.key.slice(8), parseJson(r.value, {})])),
    requests: contentRows.filter(r=>r.key.startsWith("request:")).map(r=>parseJson(r.value, {})),
    notifications: contentRows.filter(r=>r.key.startsWith("notification:")).map(r=>parseJson(r.value, {})),
    serverTime: new Date().toISOString(),
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const lookupCode = text(url.searchParams.get("code")).toUpperCase();
    const lookupPhone = text(url.searchParams.get("phone")).replace(/\s+/g, "");
    if (lookupCode || lookupPhone) {
      if (!lookupCode || !lookupPhone || lookupCode.length > 60 || lookupPhone.length > 30) {
        return Response.json({ error: "Mã lịch hoặc số điện thoại không hợp lệ." }, { status: 400 });
      }
      await ensureDefaults();
      const db = getDb();
      const [appointment] = await db.select().from(appointments).where(eq(appointments.code, lookupCode)).limit(1);
      if (!appointment || appointment.phone.replace(/\s+/g, "") !== lookupPhone) {
        return Response.json({ error: "Không tìm thấy lịch phù hợp." }, { status: 404 });
      }
      const [details] = await db.select().from(siteContent).where(eq(siteContent.key, "booking:" + appointment.code)).limit(1);
      return Response.json({ appointment, bookingDetails: parseJson(details?.value, {}) }, { headers: { "Cache-Control": "no-store" } });
    }

    const data = await snapshot();
    if (await siteAdmin(request)) return Response.json(data, { headers: { "Cache-Control": "no-store", "Vary": "Authorization" } });
    const privateSettingKeys = new Set(["bankName", "bankAccount", "bankOwner"]);
    const publicSettings = Object.fromEntries(Object.entries(data.settings).filter(([key]) => !privateSettingKeys.has(key)));
    return Response.json({
      services: data.services,
      appointments: data.appointments.map(({ code, date, time, serviceId, status }) => ({ code, date, time, serviceId, status })),
      scheduleSlots: data.scheduleSlots,
      brand: data.brand,
      settings: publicSettings,
      serverTime: data.serverTime,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: messageFor(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as Record<string, unknown>;
    const action = text(payload.action);
    const db = getDb();
    await ensureDefaults();

    const adminActions = [
      "updateAppointment",
      "deleteAppointment",
      "setScheduleSlot",
      "saveContent",
      "saveService",
      "deleteService",
      "resolveRequest",
      "updateRequest",
      "deleteRequest",
      "markNotificationsRead",
    ];
    if (adminActions.includes(action)) {
      if (!await siteAdmin(request)) {
        return Response.json({ error: "Yêu cầu quyền quản trị để thực hiện thao tác này." }, { status: 401 });
      }
    }

    if (action === "createAppointment") {
      const customer = text(payload.customer);
      const phone = text(payload.phone).replace(/\s+/g, "");
      const serviceId = text(payload.serviceId);
      const date = text(payload.date);
      const time = text(payload.time);
      if (!customer || !phone || !serviceId || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
        return Response.json({ error: "Vui lòng nhập đủ họ tên, số điện thoại, dịch vụ, ngày và giờ." }, { status: 400 });
      }
      const [selectedService] = await db.select().from(services).where(eq(services.id, serviceId)).limit(1);
      if (!selectedService?.enabled) return Response.json({ error: "Dịch vụ hiện không khả dụng." }, { status: 400 });
      if (new Date(date+'T'+time+':00+07:00').getTime()<=Date.now()) return Response.json({error:'Vui lòng chọn thời gian trong tương lai.'},{status:400});
      const dayBookings=await db.select().from(appointments).where(and(eq(appointments.date,date),ne(appointments.status,'cancelled'),ne(appointments.status,'completed')));
      const allServices=await db.select().from(services);
      const minutes=(t:string)=>Number(t.slice(0,2))*60+Number(t.slice(3));
      const start=minutes(time),end=start+selectedService.duration;
      const busy=dayBookings.some(a=>start<minutes(a.time)+(allServices.find(s=>s.id===a.serviceId)?.duration||90)&&end>minutes(a.time));
      const dayBlocks=await db.select().from(scheduleSlots).where(and(eq(scheduleSlots.slotDate,date),eq(scheduleSlots.status,'blocked')));
      const blocked=dayBlocks.some(a=>minutes(a.slotTime)>=start&&minutes(a.slotTime)<end);
      if(busy||blocked)return Response.json({error:'Thời gian này đã có lịch hoặc bị chặn. Vui lòng chọn giờ khác.'},{status:409});

      const suffix = crypto.getRandomValues(new Uint32Array(1))[0].toString(36).slice(-3).toUpperCase().padStart(3, "0");
      const [year, month, day] = date.split("-");
      const code = `HMA-${day}${month}${year.slice(-2)}-${suffix}`;
      const [settingsRow] = await db.select().from(siteContent).where(eq(siteContent.key,"settings")).limit(1);
      const settings = parseJson<Record<string, unknown>>(settingsRow?.value, initialSettings);
      if (settings.scheduleOpen === false) return Response.json({error:"Hiện đang tạm ngừng nhận lịch."},{status:409});
      const travelFee = payload.locationType === "artist" ? 0 : integer(settings.travelFee,50000);
      const total = selectedService.price + travelFee;
      const reservation = await db.run(sql`
        INSERT INTO appointments (
          code, customer, phone, email, service_id, date, time, location_type,
          address, district, ward, style, note, total, deposit, payment_status, status
        )
        SELECT ${code}, ${customer}, ${phone}, ${text(payload.email)}, ${serviceId}, ${date}, ${time},
          ${text(payload.locationType, "client")}, ${text(payload.address)}, ${text(payload.district)},
          ${text(payload.ward)}, ${text(payload.style)}, ${text(payload.note)}, ${total}, 0, 'unverified', 'pending'
        WHERE NOT EXISTS (
          SELECT 1
          FROM appointments existing
          LEFT JOIN services existing_service ON existing_service.id = existing.service_id
          WHERE existing.date = ${date}
            AND existing.status IN ('pending', 'confirmed')
            AND ${start} < (
              CAST(substr(existing.time, 1, 2) AS INTEGER) * 60
              + CAST(substr(existing.time, 4, 2) AS INTEGER)
              + COALESCE(existing_service.duration, 90)
            )
            AND ${end} > (
              CAST(substr(existing.time, 1, 2) AS INTEGER) * 60
              + CAST(substr(existing.time, 4, 2) AS INTEGER)
            )
        )
      `);
      if (reservation.meta.changes !== 1) {
        return Response.json({ error: "Thời gian này vừa được đặt bởi khách khác. Vui lòng chọn giờ khác." }, { status: 409 });
      }
      const [created] = await db.select().from(appointments).where(eq(appointments.code, code)).limit(1);
      if (!created) return Response.json({ error: "Không thể tạo lịch hẹn. Vui lòng thử lại." }, { status: 500 });

      await createNotification(db, {
        type: "appointment.created",
        title: "Có lịch đặt mới",
        message: `${customer} đã đặt ${selectedService.name} vào ${date} lúc ${time}.`,
        entityType: "appointment",
        entityId: code,
      });

      const details = {skin:text(payload.skin),allergy:text(payload.allergy),allergyNote:text(payload.allergyNote),city:text(payload.city),locationNote:text(payload.locationNote),travelFee,depositRequired:Math.min(total,integer(settings.deposit,200000)),references:Array.isArray(payload.references)?payload.references.filter(x=>typeof x==='string'&&/^\/api\/uploads\?key=/.test(x)).slice(0,3):[]};
      await db.insert(siteContent).values({key:'booking:'+code,value:JSON.stringify(details)});
      const [existingCustomer] = await db.select().from(customers).where(eq(customers.phone, phone)).limit(1);
      if (existingCustomer) {
        await db.update(customers).set({
          name: customer,
          email: text(payload.email),
          visits: existingCustomer.visits + 1,
          updatedAt: new Date().toISOString(),
        }).where(eq(customers.id, existingCustomer.id));
      } else {
        await db.insert(customers).values({ name: customer, phone, email: text(payload.email), visits: 1 });
      }
      return Response.json({ appointment: created }, { status: 201 });
    }

    if (action === "updateAppointment") {
      const code = text(payload.code);
      if (!code) return Response.json({ error: "Thiếu mã lịch hẹn." }, { status: 400 });
      const allowedStatus = ["pending", "confirmed", "completed", "cancelled"];
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
      if (payload.total !== undefined) changes.total = integer(payload.total);

      const [current] = await db.select().from(appointments).where(eq(appointments.code,code)).limit(1);
      if (!current) return Response.json({error:"Không tìm thấy lịch hẹn."},{status:404});
      const nextStatus = text(payload.status);
      if (nextStatus === "completed" && current.status !== "confirmed") return Response.json({ error: "Chỉ lịch đã xác nhận mới được đánh dấu hoàn thành." }, { status: 409 });
      if (current.status === "completed" && nextStatus && nextStatus !== "completed") return Response.json({ error: "Lịch đã hoàn thành không thể quay về trạng thái khác." }, { status: 409 });
      if (current.status === "cancelled" && nextStatus && nextStatus !== "cancelled") return Response.json({ error: "Lịch đã hủy không thể mở lại từ thao tác này." }, { status: 409 });
      if (changes.date || changes.time) {
        const nextDate=String(changes.date||current.date), nextTime=String(changes.time||current.time);
        const rows=await db.select().from(appointments).where(and(eq(appointments.date,nextDate),ne(appointments.status,'cancelled'),ne(appointments.status,'completed'),ne(appointments.code,code)));
        const serviceRows=await db.select().from(services);
        const sid = String(changes.serviceId || current.serviceId);
        const minutes=(t:string)=>Number(t.slice(0,2))*60+Number(t.slice(3));
        const start=minutes(nextTime),end=start+(serviceRows.find(s=>s.id===sid)?.duration||90);
        if(rows.some(a=>start<minutes(a.time)+(serviceRows.find(s=>s.id===a.serviceId)?.duration||90)&&end>minutes(a.time)))return Response.json({error:'Thời gian mới trùng một lịch khác.'},{status:409});
      }
      const newTotal = changes.total !== undefined ? integer(changes.total) : current.total;
      if (payload.deposit !== undefined && integer(payload.deposit)>newTotal) return Response.json({error:"Khoản đã nhận không được vượt tổng chi phí."},{status:400});
      if (payload.deposit !== undefined) {
        changes.deposit = integer(payload.deposit);
        changes.paymentStatus = integer(payload.deposit) > 0 ? "received" : "unverified";
      }
      if (payload.paymentStatus !== undefined && ["received", "pending_verification", "unverified"].includes(text(payload.paymentStatus))) {
        changes.paymentStatus = text(payload.paymentStatus);
      }
      if (payload.refundStatus !== undefined && ["none", "pending", "approved", "paid", "rejected"].includes(text(payload.refundStatus))) {
        changes.refundStatus = text(payload.refundStatus);
      }
      if (payload.refundNote !== undefined) changes.refundNote = text(payload.refundNote).slice(0, 1000);
      if (nextStatus === "cancelled" && current.deposit > 0 && !payload.refundStatus) changes.refundStatus = "pending";
      const [updated] = await db.update(appointments).set(changes).where(eq(appointments.code, code)).returning();
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

    if (action === "deleteAppointment") {
      const code = text(payload.code);
      if (!code) return Response.json({ error: "Thiếu mã lịch hẹn." }, { status: 400 });
      await db.delete(appointments).where(eq(appointments.code, code));
      await db.delete(siteContent).where(eq(siteContent.key, 'booking:' + code));
      return Response.json({ ok: true });
    }

    if (action === "reportPayment") {
      const code=text(payload.code);
      const [a]=await db.select().from(appointments).where(eq(appointments.code,code)).limit(1);
      if(!a||a.status==='cancelled')return Response.json({error:'Lịch không khả dụng.'},{status:404});
      if(a.paymentStatus==='received' || a.paymentStatus==='pending_verification')return Response.json({appointment:a});
      const [appointment]=await db.update(appointments).set({paymentStatus:'pending_verification',updatedAt:new Date().toISOString()}).where(eq(appointments.code,code)).returning();
      await createNotification(db, {
        type: "payment.reported",
        title: "Khách báo đã chuyển cọc",
        message: `Lịch ${code} đang chờ kiểm tra giao dịch và xác nhận tiền cọc.`,
        entityType: "appointment",
        entityId: code,
      });
      return Response.json({appointment});
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
      const message=text(payload.message); const subject=text(payload.subject); const code=text(payload.code);
      const [a]=code?await db.select().from(appointments).where(eq(appointments.code,code)).limit(1):[];
      const name=text(payload.name)||a?.customer||'';const phone=text(payload.phone)||a?.phone||'';
      if(!name||!phone||!message||!subject||message.length>4000)return Response.json({error:'Vui lòng nhập đầy đủ thông tin và lời nhắn (tối đa 4.000 ký tự).'},{status:400});
      const id='YC-'+crypto.randomUUID().slice(0,8).toUpperCase();
      const record={id,kind:code?'appointment':'consultation',code,name,phone,email:text(payload.email),subject,message,date:text(payload.date),time:text(payload.time),status:'pending',createdAt:new Date().toISOString(),reply:''};
      await db.insert(siteContent).values({key:'request:'+id,value:JSON.stringify(record)});
      await createNotification(db, {
        type: code ? "appointment.request" : "consultation.created",
        title: code ? "Có yêu cầu từ lịch hẹn" : "Có yêu cầu tư vấn mới",
        message: code ? `${name} gửi yêu cầu cho lịch ${code}.` : `${name} gửi yêu cầu tư vấn: ${subject}.`,
        entityType: "request",
        entityId: id,
      });
      return Response.json({request:record},{status:201});
    }
    if (action === "resolveRequest" || action === "updateRequest") {
      const id = text(payload.id);
      const key = 'request:' + id;
      const [row] = await db.select().from(siteContent).where(eq(siteContent.key, key)).limit(1);
      if (!row) return Response.json({ error: 'Không tìm thấy yêu cầu.' }, { status: 404 });
      const current = parseJson<Record<string, unknown>>(row.value, {});
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
        const code = text(current.code);
        const [appointment] = await db.select().from(appointments).where(eq(appointments.code, code)).limit(1);
        if (!appointment || appointment.status === "cancelled" || appointment.status === "completed") {
          return Response.json({ error: "Lịch hẹn không còn đủ điều kiện để đổi lịch." }, { status: 409 });
        }
        const [serviceRows, conflictRows, blockedRows] = await Promise.all([
          db.select().from(services),
          db.select().from(appointments).where(and(
            eq(appointments.date, requestedDate),
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
        await db.update(appointments).set({ date: requestedDate, time: requestedTime, updatedAt: new Date().toISOString() }).where(eq(appointments.code, code));
      }
      await db.update(siteContent).set({ value: JSON.stringify(record), updatedAt: new Date().toISOString() }).where(eq(siteContent.key, key));
      return Response.json({ request: record });
    }
    if (action === "deleteRequest") {
      const id = text(payload.id);
      const key = 'request:' + id;
      await db.delete(siteContent).where(eq(siteContent.key, key));
      return Response.json({ ok: true });
    }
    if (action === "setScheduleSlot") {
      const slotDate = text(payload.date);
      const slotTime = text(payload.time);
      const status = text(payload.status) === "blocked" ? "blocked" : "available";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(slotDate) || !/^\d{2}:\d{2}$/.test(slotTime)) {
        return Response.json({ error: "Ngày hoặc giờ không hợp lệ." }, { status: 400 });
      }
      await db.insert(scheduleSlots).values({ slotDate, slotTime, status, note: text(payload.note) })
        .onConflictDoUpdate({
          target: [scheduleSlots.slotDate, scheduleSlots.slotTime],
          set: { status, note: text(payload.note), updatedAt: new Date().toISOString() },
        });
      return Response.json({ ok: true });
    }

    if (action === "saveContent") {
      const key = text(payload.key);
      if (!["brand", "settings"].includes(key) || typeof payload.value !== "object" || !payload.value) {
        return Response.json({ error: "Nội dung không hợp lệ." }, { status: 400 });
      }
      await db.insert(siteContent).values({ key, value: JSON.stringify(payload.value) })
        .onConflictDoUpdate({ target: siteContent.key, set: { value: JSON.stringify(payload.value), updatedAt: new Date().toISOString() } });
      return Response.json({ ok: true });
    }

    if (action === "saveService") {
      const id = text(payload.id) || `service-${Date.now()}`;
      const values = {
        id,
        name: text(payload.name),
        duration: integer(payload.duration, 60),
        price: integer(payload.price),
        description: text(payload.description),
        enabled: payload.enabled !== false,
        contact: payload.contact === true,
        sortOrder: integer(payload.sortOrder, 99),
        updatedAt: new Date().toISOString(),
      };
      if (!values.name) return Response.json({ error: "Vui lòng nhập tên dịch vụ." }, { status: 400 });
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

    if (action === "reverseGeocode") {
      const lat = Number(payload.lat);
      const lon = Number(payload.lon);
      if (payload.lat == null || payload.lon == null || !Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        return Response.json({ error: "Tọa độ GPS không hợp lệ." }, { status: 400 });
      }
      let rawResult: { street?: string; ward?: string; district?: string; city?: string; fullStr?: string; lat?: number; lon?: number } | null = null;

      try {
        const nomRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&accept-language=vi`, {
          headers: { 'User-Agent': 'HoanMakeupArtist/1.0 (booking@hoanmakeup.vn)' }
        });
        if (nomRes.ok) {
          const data = await nomRes.json() as Record<string, unknown>;
          const a = (data.address || {}) as Record<string, string>;
          const houseNumber = a.house_number || '';
          const road = a.road || a.street || a.amenity || a.building || '';
          const street = [houseNumber, road].filter(Boolean).join(' ');
          const ward = a.suburb || a.quarter || a.neighbourhood || '';
          const district = a.city_district || a.district || a.county || '';
          const rawCity = a.city || a.state || a.province || 'Hà Nội';
          rawResult = {
            street: street || (data.name as string) || '',
            ward,
            district,
            city: rawCity,
            fullStr: (data.display_name as string) || '',
            lat,
            lon
          };
        }
      } catch (e) {
        console.warn('Backend Nominatim error:', e);
      }

      if (!rawResult) {
        try {
          const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=vi`;
          const bdcRes = await fetch(bdcUrl);
          if (bdcRes.ok) {
            const data = await bdcRes.json() as Record<string, unknown>;
            const rawCity = (data.city as string) || (data.principalSubdivision as string) || 'Hà Nội';
            const district = (data.locality as string) || '';
            let ward = '';
            const localityInfo = data.localityInfo as { administrative?: Array<{ description?: string; name?: string }> } | undefined;
            if (Array.isArray(localityInfo?.administrative)) {
              const wardObj = localityInfo.administrative.find((x) =>
                x.description?.includes('phường') || x.description?.includes('xã') || x.name?.startsWith('Phường') || x.name?.startsWith('Xã')
              );
              if (wardObj?.name) ward = wardObj.name;
            }
            rawResult = {
              street: '',
              ward,
              district,
              city: rawCity,
              fullStr: '',
              lat,
              lon
            };
          }
        } catch (e) {
          console.warn('Backend BigDataCloud error:', e);
        }
      }

      if (rawResult) {
        let { street = '', ward = '', district = '', city = '', fullStr = '', lat: rLat, lon: rLon } = rawResult;

        if (!city || city.includes('Hà Nội') || city.includes('Ha Noi') || city.includes('HN')) {
          city = 'Hà Nội';
        } else if (city.includes('Hồ Chí Minh') || city.includes('Ho Chi Minh') || city.includes('Sài Gòn')) {
          city = 'TP. Hồ Chí Minh';
        } else if (city.includes('Đà Nẵng')) {
          city = 'Đà Nẵng';
        } else if (city.includes('Hải Phòng')) {
          city = 'Hải Phòng';
        } else if (city.includes('Cần Thơ')) {
          city = 'Cần Thơ';
        }

        if (city === 'Hà Nội') {
          // Specific road and area normalization for Hanoi
          if (street.includes('Châu Văn Liêm') || fullStr.includes('Châu Văn Liêm') || (rLat && rLat >= 21.000 && rLat <= 21.015 && rLon && rLon >= 105.760 && rLon <= 105.775)) {
            street = street || 'Đường Châu Văn Liêm';
            district = 'Nam Từ Liêm';
            ward = 'Phường Phú Đô';
          } else if (street.includes('Mễ Trì') || fullStr.includes('Mễ Trì') || fullStr.includes('The Matrix One') || fullStr.includes('Keangnam')) {
            district = 'Nam Từ Liêm';
            ward = 'Phường Mễ Trì';
          } else if (street.includes('Mỹ Đình') || fullStr.includes('Mỹ Đình')) {
            district = 'Nam Từ Liêm';
            ward = 'Phường Mỹ Đình 1';
          } else if (street.includes('Lê Đức Thọ') || street.includes('Hàm Nghi')) {
            district = 'Nam Từ Liêm';
            ward = 'Phường Mỹ Đình 2';
          } else if (street.includes('Định Công') || fullStr.includes('Định Công')) {
            district = 'Hoàng Mai';
            ward = 'Phường Định Công';
          } else if (street.includes('Linh Đàm') || fullStr.includes('Linh Đàm')) {
            district = 'Hoàng Mai';
            ward = 'Phường Hoàng Liệt';
          } else if (street.includes('Cầu Giấy') || street.includes('Duy Tân') || street.includes('Trần Thái Tông')) {
            district = 'Cầu Giấy';
            ward = 'Phường Dịch Vọng Hậu';
          }

          if (district === 'Từ Liêm' || district === 'Phường Từ Liêm' || district.includes('Từ Liêm')) {
            if (!district.startsWith('Nam') && !district.startsWith('Bắc')) {
              district = (rLat && rLat >= 21.04) ? 'Bắc Từ Liêm' : 'Nam Từ Liêm';
            }
          }

          if (ward === 'Xuân Phong') ward = 'Phường Phú Đô';
          else if (ward === 'Kẻ Lủ') ward = 'Phường Định Công';
          else if (ward === 'Khu phố cổ') ward = 'Phường Hàng Bạc';

          if (ward && !ward.startsWith('Phường') && !ward.startsWith('Xã') && !ward.startsWith('Thị trấn')) {
            ward = 'Phường ' + ward;
          }
          if (district.startsWith('Quận ')) {
            district = district.slice(5);
          }
        }

        const districtLabel = district && /^(Quận|Huyện|Thị xã|TP\.|Thành phố)\s+/i.test(district) ? district : district ? `Quận ${district}` : '';
        const fullParts = [street, ward, districtLabel, city].filter(Boolean);
        const fullAddress = fullParts.join(', ');

        return Response.json({
          fullAddress,
          address: street,
          city,
          district,
          ward,
          source: 'normalized'
        });
      }

      return Response.json({ error: "Không thể nhận diện được địa chỉ từ vị trí này." }, { status: 404 });
    }

    return Response.json({ error: "Thao tác không được hỗ trợ." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: messageFor(error) }, { status: 500 });
  }
}
