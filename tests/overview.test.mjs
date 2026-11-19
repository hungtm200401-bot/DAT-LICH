import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOverview, filterOverviewRequests, overviewCsv, searchAdminSnapshot, vietnamDay } from '../public/overview-utils.js';
import { createAdminOverview } from '../public/admin-overview.js';

const now = '2026-11-01T01:00:00Z';
const payment = (id, kind, amount, occurredAt) => ({ id, kind, amount, occurredAt, createdAt: occurredAt, appointmentCode: 'A' });
function fixture() {
  return {
    backendReady: true,
    services: [{ id: 'party', name: 'Trang điểm dự tiệc' }],
    appointments: [
      { code: 'A', date: '2026-11-01', time: '14:00', status: 'pending', serviceId: 'party', deposit: 100, paymentStatus: 'pending_verification', finance: { netReceived: 70 } },
      { code: 'B', date: '2026-11-01', time: '08:00', status: 'confirmed', serviceId: 'legacy', deposit: 20 },
      { code: 'C', date: '2026-11-01', time: '09:00', status: 'cancelled', serviceId: 'party', deposit: 30, paymentStatus: 'pending_verification' },
      { code: 'D', date: '2026-10-31', time: '10:00', status: 'completed', serviceId: 'party', deposit: 0 },
      { code: 'E', date: '2026-11-02', time: '10:00', status: 'cancelled', serviceId: 'party', deposit: 40, refundStatus: 'rejected' },
    ],
    paymentTransactions: [
      payment('old', 'deposit', 90, '2026-10-31T16:59:59Z'),
      payment('income', 'balance', 100, '2026-10-31T17:00:00Z'),
      payment('refund', 'refund', 170, '2026-11-01T00:00:00Z'),
      payment('opening', 'opening', 99999, '2026-11-01T00:00:00Z'),
      payment('invalid', 'deposit', 99999, 'bad-date'),
    ],
    requests: [{ id: 'r1', code: 'A', subject: 'Yêu cầu đổi lịch' }, { id: 'r2', code: 'B', subject: 'Đổi ngày', status: 'in_progress' }, { id: 'r3', code: 'A', subject: 'Đổi lịch', status: 'cancelled' }, { id: 'r4', subject: 'Tư vấn', status: 'pending' }],
    notifications: [{ id: 'n1', title: '<img src=x onerror=alert(1)>', message: '<script>bad</script>', entityType: 'appointment', entityId: 'A', createdAt: '2026-11-01T01:00:00Z', status: 'unread' }],
  };
}

test('Vietnam calendar crosses UTC month boundary and seven days cross year boundary', () => {
  assert.equal(vietnamDay('2026-10-31T17:00:00Z'), '2026-11-01');
  assert.equal(vietnamDay('invalid'), '');
  const model = buildOverview({}, '2026-12-31T17:30:00Z');
  assert.equal(model.today, '2027-01-01');
  assert.deepEqual(model.days.map(row => row.day), ['2026-12-26', '2026-12-27', '2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31', '2027-01-01']);
});
test('overview uses actual dated cash, preserves negative refunds and separates historical balances', () => {
  const model = buildOverview(fixture(), now);
  assert.equal(model.monthNet, -70);
  assert.equal(model.weekNet, 20);
  assert.deepEqual(model.days.at(-1), { day: '2026-11-01', received: 100, refunded: 170, net: -70 });
  assert.equal(model.retained, 160);
  assert.deepEqual(model.todayRows.map(row => row.code), ['B', 'A']);
  assert.equal(model.pending, 1);
  assert.equal(model.paymentPending, 1);
  assert.equal(model.refunds, 1);
  assert.equal(model.reschedules, 2);
  assert.equal(model.services.reduce((sum, row) => sum + row.count, 0), 3);
  assert.equal(model.services.find(row => row.id === 'legacy').count, 1);
});
test('open reschedule filters exclude resolved/cancelled and consultation requests', () => {
  const rows = fixture().requests;
  assert.deepEqual(filterOverviewRequests(rows, { status: 'open', type: 'reschedule' }).map(row => row.id), ['r1', 'r2']);
  assert.equal(filterOverviewRequests(rows, { status: 'all' }).length, 4);
});
test('recent activity uses real notices/cash records, sorted by recorded time with no opening events', () => {
  const model = buildOverview(fixture(), now);
  assert.equal(model.activity[0].id, 'notice-n1');
  assert.ok(model.activity.every(row => !['payment-opening', 'payment-invalid'].includes(row.id)));
  assert.equal(model.activity.find(row => row.id === 'payment-refund').amount, -170);
});
test('CSV reflects displayed metrics and protects text formulas without corrupting numeric refunds', () => {
  const data = fixture(); data.services[0].name = ' =SUM(1,2)';
  const csv = overviewCsv(buildOverview(data, now));
  assert.ok(csv.startsWith('\uFEFF'));
  assert.match(csv, /"Thu ròng tháng","-70","2026-11"/);
  assert.match(csv, /"2026-11-01","100","170","-70"/);
  assert.ok(csv.includes('"\' =SUM(1,2)"'));
});
test('header search finds Vietnamese customer names, phone numbers and bank references in actual records', () => {
  const data = fixture();
  data.customers = [{ name: 'Đỗ Ánh', phone: '0901234567', email: 'anh@example.test' }];
  data.appointments[0].customer = 'Đỗ Ánh';
  data.paymentTransactions[0].reference = 'BANK-123';
  assert.equal(searchAdminSnapshot(data, 'do anh').customers.length, 1);
  assert.equal(searchAdminSnapshot(data, 'do anh').appointments.length, 1);
  assert.equal(searchAdminSnapshot(data, '090123').customers.length, 1);
  assert.equal(searchAdminSnapshot(data, 'bank-123').payments.length, 1);
  assert.deepEqual(searchAdminSnapshot(data, ''), { appointments: [], customers: [], payments: [] });
});
test('compact renderer escapes appointment names and distinguishes unavailable data from zero', () => {
  const data = fixture();
  data.appointments[0].date = vietnamDay();
  data.appointments[0].customer = '<img src=x onerror=alert(1)>';
  const esc = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
  const overview = createAdminOverview({ getState: () => data, esc, money: String, icon: () => '', appointmentsTable: () => '<p>Today rows</p>' });
  let html = overview.content();
  assert.ok(!html.includes('<img src=x'));
  assert.ok(html.includes('&lt;img'));
  assert.equal((html.match(/class="overview-stat"/g) || []).length, 3);
  assert.doesNotMatch(html, /overview-cash-table|overview-services/);
  assert.match(html, /overview-cash-chart/);
  assert.match(html, /overview-activity/);
  assert.match(html, /Dòng tiền 7 ngày/);
  assert.match(html, /status=open&type=reschedule/);
  assert.match(html, /data-overview="export"/);
  data.backendReady = false; data.backendError = 'offline';
  html = overview.content();
  assert.match(html, /Số liệu chưa khả dụng/);
  assert.match(html, /data-overview="export" disabled/);
  assert.doesNotMatch(html, /class="overview-bars"|class="overview-event"/,'unavailable data must not show a misleading chart or activity');
  const empty = buildOverview({}, now);
  assert.equal(empty.monthNet, 0);
  assert.equal(empty.activity.length, 0);
  assert.equal(empty.days.length, 7);
});
