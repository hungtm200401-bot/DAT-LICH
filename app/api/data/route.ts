import { and, asc, desc, eq, ne } from "drizzle-orm";
import { getDb } from "../../../db";
import { appointments, customers, scheduleSlots, services, siteContent } from "../../../db/schema";

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

  // 1. Purge all mock/seed/dummy appointments
  try {
    const allAppts = await db.select({ code: appointments.code, customer: appointments.customer }).from(appointments);
    const mockNames = [
      'Nguyễn Minh Anh', 'Trần Ngọc Hà', 'Lê Thu Trang', 'Phạm Mai Linh', 'Hà Vy',
      'Đỗ Quỳnh Chi', 'Bùi Thảo Nguyên', 'Nguyễn Thùy Dung', 'Vũ Hoàng Yến',
      'Cầu Giấy', 'Tây Hồ', 'Nam Từ Liêm', 'Đặng Thu Trang', 'Đinh Mai Anh',
      'Hoàng Phương Linh', 'Thanh Xuân', 'Mai Anh', 'Lưu Gia Hân', 'Phương Thảo',
      'Hải Yến', 'Kim Ngân', 'Thu Phương', 'Ngọc Anh', 'Khánh Linh', 'Ngọc Diệp',
      'Hương Giang', 'Bảo Trâm', 'Quỳnh Anh'
    ];
    for (const a of allAppts) {
      if (
        mockNames.includes(a.customer) ||
        ['HMA-090926-BQ0', 'HMA-090926-MQ3', 'HMA-100926-MS7', 'HMA-090926-BIQ', 'HMA-180926-6W2'].includes(a.code)
      ) {
        await db.delete(appointments).where(eq(appointments.code, a.code));
      }
    }
  } catch { /* ignore */ }

  // 2. Clear mock schedule slots
  try {
    const allSlots = await db.select({ id: scheduleSlots.id, note: scheduleSlots.note }).from(scheduleSlots);
    for (const s of allSlots) {
      if (s.note === 'Di chuyển' || s.note === 'Nghỉ giữa lịch' || s.note === 'Không khả dụng' || !s.note) {
        await db.delete(scheduleSlots).where(eq(scheduleSlots.id, s.id));
      }
    }
  } catch { /* ignore */ }

  // 3. Clear mock customers
  try {
    const mockNames = [
      'Nguyễn Minh Anh', 'Trần Ngọc Hà', 'Lê Thu Trang', 'Phạm Mai Linh', 'Hà Vy',
      'Đỗ Quỳnh Chi', 'Bùi Thảo Nguyên', 'Nguyễn Thùy Dung', 'Vũ Hoàng Yến',
      'Cầu Giấy', 'Tây Hồ', 'Nam Từ Liêm', 'Đặng Thu Trang', 'Đinh Mai Anh',
      'Hoàng Phương Linh', 'Thanh Xuân', 'Mai Anh', 'Lưu Gia Hân', 'Phương Thảo',
      'Hải Yến', 'Kim Ngân', 'Thu Phương', 'Ngọc Anh', 'Khánh Linh', 'Ngọc Diệp',
      'Hương Giang', 'Bảo Trâm', 'Quỳnh Anh'
    ];
    for (const name of mockNames) {
      await db.delete(customers).where(eq(customers.name, name));
    }
  } catch { /* ignore */ }
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
    serverTime: new Date().toISOString(),
  };
}

export async function GET() {
  try {
    return Response.json(await snapshot(), { headers: { "Cache-Control": "no-store" } });
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
      const dayBookings=await db.select().from(appointments).where(and(eq(appointments.date,date),ne(appointments.status,'cancelled')));
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
      const [created] = await db.insert(appointments).values({
        code,
        customer,
        phone,
        email: text(payload.email),
        serviceId,
        date,
        time,
        locationType: text(payload.locationType, "client"),
        address: text(payload.address),
        district: text(payload.district),
        ward: text(payload.ward),
        style: text(payload.style),
        note: text(payload.note),
        total,
        deposit: 0,
        paymentStatus: "unverified",
        status: "pending",
      }).returning();

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
      if (changes.date || changes.time) {
        const nextDate=String(changes.date||current.date), nextTime=String(changes.time||current.time);
        const rows=await db.select().from(appointments).where(and(eq(appointments.date,nextDate),ne(appointments.status,'cancelled'),ne(appointments.code,code)));
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
      if (payload.status === "confirmed") {
        if (changes.deposit === undefined && (!current.deposit || current.deposit === 0)) {
          changes.deposit = 200000;
        }
        changes.paymentStatus = "received";
      } else if (payload.status === "pending" && payload.deposit === undefined && payload.paymentStatus === undefined) {
        changes.paymentStatus = "pending_verification";
      }
      const [updated] = await db.update(appointments).set(changes).where(eq(appointments.code, code)).returning();
      if (!updated) return Response.json({ error: "Không tìm thấy lịch hẹn." }, { status: 404 });
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
      if(a.paymentStatus==='received')return Response.json({appointment:a});
      const [appointment]=await db.update(appointments).set({paymentStatus:'pending_verification',updatedAt:new Date().toISOString()}).where(eq(appointments.code,code)).returning();
      return Response.json({appointment});
    }
    if (action === "createRequest") {
      const message=text(payload.message); const subject=text(payload.subject); const code=text(payload.code);
      const [a]=code?await db.select().from(appointments).where(eq(appointments.code,code)).limit(1):[];
      const name=text(payload.name)||a?.customer||'';const phone=text(payload.phone)||a?.phone||'';
      if(!name||!phone||!message||!subject||message.length>4000)return Response.json({error:'Vui lòng nhập đầy đủ thông tin và lời nhắn (tối đa 4.000 ký tự).'},{status:400});
      const id='YC-'+crypto.randomUUID().slice(0,8).toUpperCase();
      const record={id,code,name,phone,email:text(payload.email),subject,message,date:text(payload.date),time:text(payload.time),status:'pending',createdAt:new Date().toISOString(),reply:''};
      await db.insert(siteContent).values({key:'request:'+id,value:JSON.stringify(record)});
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
      const lat = payload.lat ? Number(payload.lat) : null;
      const lon = payload.lon ? Number(payload.lon) : null;
      let rawResult: { street?: string; ward?: string; district?: string; city?: string; fullStr?: string; lat?: number; lon?: number } | null = null;

      if (lat != null && lon != null && !Number.isNaN(lat) && !Number.isNaN(lon)) {
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
      }

      if (!rawResult) {
        try {
          const bdcUrl = (lat != null && lon != null && !Number.isNaN(lat) && !Number.isNaN(lon))
            ? `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=vi`
            : `https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=vi`;
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
              lat: lat || undefined,
              lon: lon || undefined
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

        const fullParts = [street, ward, district ? `Quận ${district}` : '', city].filter(Boolean);
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
