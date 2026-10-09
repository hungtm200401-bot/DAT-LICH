import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("contains the complete booking and admin routes", async () => {
  const source = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
  for (const route of [
    "/booking/service", "/booking/time", "/booking/location", "/booking/info",
    "/booking/deposit", "/booking/confirm", "/admin", "/admin/appointments",
    "/admin/schedule", "/admin/services", "/admin/customers", "/admin/payments",
    "/admin/content", "/admin/reports", "/admin/settings",
  ]) assert.match(source, new RegExp(route.replaceAll("/", "\\/")));
});

test("persists business data through the D1 API", async () => {
  const api = await readFile(new URL("../app/api/data/route.ts", import.meta.url), "utf8");
  const schema = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");
  assert.match(api, /createAppointment/);
  assert.match(api, /setScheduleSlot/);
  assert.match(api, /saveService/);
  assert.match(schema, /sqliteTable\("appointments"/);
  assert.match(schema, /schedule_date_time_unique/);
});

test("uses the reference typography and white admin canvas", async () => {
  const css = await readFile(new URL("../public/styles.css", import.meta.url), "utf8");
  assert.match(css, /--didone:\s*"Bodoni Moda"/);
  assert.match(css, /--sans:\s*Inter/);
  assert.match(css, /\.admin-page\s*\{[^}]*background:\s*#fff/s);
  assert.match(css, /font-variant-numeric:\s*tabular-nums/);
  assert.match(css, /grid-template-columns:\s*150px repeat\(7/);
});

test("prevents selecting an occupied booking time", async () => {
  const source = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(source, /time-slot-unavailable/);
  assert.match(source, /Đã có khách/);
  assert.match(source, /el\.disabled \|\| slotUnavailable/);
});

test("lets admins mark all notifications as read", async () => {
  const source = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(source, /mark-all-notifications-read/);
  assert.match(source, /markNotificationsRead/);
  assert.match(source, /Đã đánh dấu toàn bộ thông báo là đã đọc/);
});

test("applies approved reschedule requests to the appointment", async () => {
  const api = await readFile(new URL("../app/api/data/route.ts", import.meta.url), "utf8");
  assert.match(api, /isReschedule/);
  assert.match(api, /Ngày giờ mới không còn trống/);
  assert.match(api, /date: requestedDate, time: requestedTime/);
});

test("tracks refund status for cancelled appointments", async () => {
  const api = await readFile(new URL("../app/api/data/route.ts", import.meta.url), "utf8");
  const schema = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");
  assert.match(api, /refundStatus/);
  assert.match(api, /current\.deposit > 0/);
  assert.match(schema, /refundStatus: text\("refund_status"/);
});

test("notifies admins when appointment status changes", async () => {
  const api = await readFile(new URL("../app/api/data/route.ts", import.meta.url), "utf8");
  assert.match(api, /appointment\.status/);
  assert.match(api, /Trạng thái lịch đã thay đổi/);
  assert.match(api, /payment\.refund/);
});

test("only shows a received deposit after backend payment confirmation", async () => {
  const source = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(source, /Boolean\(apt && apt\.paymentStatus === 'received' && Number\(apt\.deposit\) > 0\)/);
  assert.match(source, /a\.paymentStatus === 'received' && Number\(a\.deposit\) >= needed/);
  assert.doesNotMatch(source, /const isPaid = apt\s*\? apt\.paymentStatus === 'received'\s*:\s*\(!!state\.booking\.depositPaid/);
});

test("sends deposit reports to the admin notification flow", async () => {
  const api = await readFile(new URL("../app/api/data/route.ts", import.meta.url), "utf8");
  const source = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(api, /action === "reportPayment"/);
  assert.match(api, /type: "payment\.reported"/);
  assert.match(source, /await api\(\{action:'reportPayment'/);
  assert.match(source, /Đã gửi thông báo chuyển khoản cho Hoàn/);
});

test("routes approved appointments into the work schedule", async () => {
  const source = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
  const mobile = await readFile(new URL("../public/mobile-admin.js", import.meta.url), "utf8");
  assert.match(source, /a\.status === 'confirmed' && !staleCodes\.includes\(a\.code\)/);
  assert.match(mobile, /a\.status === 'confirmed'/);
  assert.match(source, /query\.get\('code'\)/);
});

test("prevents duplicate deposit reports while awaiting review", async () => {
  const api = await readFile(new URL("../app/api/data/route.ts", import.meta.url), "utf8");
  const source = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(api, /a\.paymentStatus==='received' \|\| a\.paymentStatus==='pending_verification'/);
  assert.match(source, /btn-deposit-pending" disabled aria-disabled="true">ĐANG CHỜ ĐỐI SOÁT/);
  assert.doesNotMatch(source, /btn-deposit-pending" data-action="ct-deposit-confirmed-proceed"/);
});

test("creates a server appointment before reporting a deposit when needed", async () => {
  const source = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(source, /const latest = await api\(\);/);
  assert.match(source, /action: 'createAppointment'/);
  assert.match(source, /action:'reportPayment',code:appointment\.code/);
});

test("starts a fresh booking instead of reusing an old appointment", async () => {
  const source = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(source, /data-action="start-booking"/);
  assert.match(source, /state\.booking = structuredClone\(defaultState\.booking\)/);
  assert.match(source, /const code = state\.booking\.code \|\| \('LK'/);
});

test("configures production CMS uploads and authenticates the image editor", async () => {
  const hosting = JSON.parse(await readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"));
  const editor = await readFile(new URL("../public/image-editor.js", import.meta.url), "utf8");
  const tools = await readFile(new URL("../public/site-tools.js", import.meta.url), "utf8");
  const uploads = await readFile(new URL("../app/api/uploads/route.ts", import.meta.url), "utf8");
  assert.equal(hosting.r2, "BUCKET");
  assert.match(editor, /headers: uploadHeaders\(\)/);
  assert.match(tools, /uploadHeaders: adminHeaders/);
  assert.doesNotMatch(editor, /accept="[^"]*image\/gif/);
  assert.match(uploads, /Kho ảnh chưa được cấu hình/);
  assert.match(uploads, /status:503/);
});

test("runs repeatable local migrations without re-adding refund columns", async () => {
  const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  const migration = await readFile(new URL("../scripts/migrate-local.mjs", import.meta.url), "utf8");
  assert.equal(pkg.scripts["db:migrate:local"], "node scripts/migrate-local.mjs");
  assert.match(migration, /PRAGMA table_info\(appointments\)/);
  assert.match(migration, /columns\.has\(name\)/);
});

test("handles GPS permission and address confirmation without inaccurate IP fallback", async () => {
  const source = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
  const api = await readFile(new URL("../app/api/data/route.ts", import.meta.url), "utf8");
  assert.match(source, /Quyền định vị đang bị chặn/);
  assert.match(source, /resetLocationConfirmation/);
  assert.match(source, /enableHighAccuracy: false/);
  assert.doesNotMatch(source, /api\(\{ action: 'reverseGeocode' \}\)/);
  assert.match(api, /Tọa độ GPS không hợp lệ/);
  assert.doesNotMatch(api, /reverse-geocode-client\?localityLanguage=vi/);
});

test("uses the complete two-level Vietnam administrative directory with searchable legacy districts", async () => {
  const current = JSON.parse(await readFile(new URL("../public/data/vietnam-administrative-latest.json", import.meta.url), "utf8"));
  const legacy = JSON.parse(await readFile(new URL("../public/data/vietnam-legacy-districts.json", import.meta.url), "utf8"));
  const source = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
  const wards = current.flatMap(province => province.wards || []);
  const districts = legacy.flatMap(province => province.districts || []);

  assert.equal(current.length, 34);
  assert.equal(wards.length, 3321);
  assert.equal(districts.length, 696);
  assert.ok(wards.every(ward => /^(Phường|Xã|Đặc khu)\s/.test(ward.name)));
  assert.match(source, /data-location-search="\$\{field\}"/);
  assert.match(source, /locationSearchKey/);
  assert.match(source, /Quận \/ huyện cũ \(nếu có\)/);
  assert.match(source, /Phường \/ xã \/ đặc khu hiện hành/);
});

test("preserves form focus and scroll when background data re-renders the same page", async () => {
  const source = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(source, /const routeChanged = path !== lastRenderedPath/);
  assert.match(source, /field\.focus\(\{ preventScroll: true \}\)/);
  assert.match(source, /window\.scrollTo\(previousScroll\.x, previousScroll\.y\)/);
  assert.match(source, /if \(routeChanged\) \{\s*window\.scrollTo\(0, 0\)/s);
});
