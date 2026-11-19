const timezone = 'Asia/Ho_Chi_Minh';
const dayFormatter = new Intl.DateTimeFormat('sv-SE', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' });
export function vietnamDay(value = new Date()) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? dayFormatter.format(date) : '';
}
export const isOpenRequest = row => ['pending', 'in_progress'].includes(row.status || 'pending');
export const isRescheduleRequest = row => Boolean(row.code) && /đổi lịch|đổi ngày|reschedule/i.test(String(row.subject || ''));
const amount = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const cashKinds = new Set(['deposit', 'balance', 'refund']);
export const cashValue = entry => (entry.kind === 'refund' ? -1 : 1) * amount(entry.amount);

export function filterOverviewRequests(rows, { status = 'all', type = '' } = {}) {
  return rows.filter(row => (status === 'all' || (status === 'open' ? isOpenRequest(row) : (row.status || 'pending') === status)) && (type !== 'reschedule' || isRescheduleRequest(row)));
}

export function buildOverview(state, now = new Date()) {
  const today = vietnamDay(now), month = today.slice(0, 7);
  const appointments = state.appointments || [], payments = state.paymentTransactions || [];
  const active = appointments.filter(row => row.status !== 'cancelled');
  const todayRows = active.filter(row => row.date === today).slice().sort((a, b) => String(a.time).localeCompare(String(b.time)) || String(a.code).localeCompare(String(b.code)));
  const retained = row => amount(row.finance?.netReceived ?? row.deposit);
  const cash = payments.filter(row => cashKinds.has(row.kind) && row.occurredAt && vietnamDay(row.occurredAt));
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today + 'T12:00:00+07:00');
    date.setUTCDate(date.getUTCDate() - 6 + index);
    const day = vietnamDay(date), entries = cash.filter(row => vietnamDay(row.occurredAt) === day);
    const received = entries.filter(row => row.kind !== 'refund').reduce((sum, row) => sum + amount(row.amount), 0);
    const refunded = entries.filter(row => row.kind === 'refund').reduce((sum, row) => sum + amount(row.amount), 0);
    return { day, received, refunded, net: received - refunded };
  });
  const serviceMap = new Map((state.services || []).map(row => [row.id, { id: row.id, name: row.name, count: 0 }]));
  for (const row of active) {
    if (!serviceMap.has(row.serviceId)) serviceMap.set(row.serviceId, { id: row.serviceId, name: 'Dịch vụ cũ · ' + (row.serviceId || 'Chưa phân loại'), count: 0 });
    serviceMap.get(row.serviceId).count++;
  }
  const services = [...serviceMap.values()].filter(row => row.count).map(row => ({ ...row, percent: Math.round(row.count / Math.max(active.length, 1) * 100) })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'vi'));
  const activity = [
    ...(state.notifications || []).map(row => ({ id: 'notice-' + row.id, title: row.title || 'Thông báo', detail: row.message || '', time: row.createdAt, kind: row.entityType === 'appointment' ? 'appointment' : row.entityType === 'request' ? 'request' : 'notification', code: row.entityId })),
    ...payments.filter(row => cashKinds.has(row.kind)).map(row => ({ id: 'payment-' + row.id, title: ({ deposit: 'Đã ghi nhận tiền cọc', balance: 'Đã thu phần còn lại', refund: 'Đã ghi nhận hoàn tiền' })[row.kind], detail: row.appointmentCode || '', amount: cashValue(row), time: row.createdAt || row.occurredAt, kind: 'appointment', code: row.appointmentCode })),
  ].filter(row => row.time && Number.isFinite(new Date(row.time).getTime())).sort((a, b) => new Date(b.time) - new Date(a.time) || a.id.localeCompare(b.id)).slice(0, 6);
  return {
    today, month, todayRows, services, activity, days,
    pending: appointments.filter(row => row.status === 'pending').length,
    paymentPending: active.filter(row => row.paymentStatus === 'pending_verification').length,
    reschedules: (state.requests || []).filter(row => isOpenRequest(row) && isRescheduleRequest(row)).length,
    refunds: appointments.filter(row => row.status === 'cancelled' && retained(row) > 0 && row.refundStatus !== 'rejected').length,
    unread: (state.notifications || []).filter(row => row.status === 'unread').length,
    retained: appointments.reduce((sum, row) => sum + retained(row), 0),
    monthNet: cash.filter(row => vietnamDay(row.occurredAt).startsWith(month)).reduce((sum, row) => sum + cashValue(row), 0),
    weekNet: days.reduce((sum, day) => sum + day.net, 0),
  };
}

export function searchAdminSnapshot(state, query) {
  const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLocaleLowerCase('vi');
  const keyword = normalize(query).trim();
  if (keyword.length < 2) return { appointments: [], customers: [], payments: [] };
  const matches = values => normalize(values.join(' ')).includes(keyword);
  const appointments = state.appointments || [];
  return {
    appointments: appointments.filter(row => matches([row.code, row.customer, row.phone])).slice(0, 8),
    customers: (state.customers || []).filter(row => matches([row.name, row.phone, row.email])).slice(0, 8),
    payments: (state.paymentTransactions || []).filter(row => matches([row.id, row.reference, row.appointmentCode, appointments.find(appointment => appointment.code === row.appointmentCode)?.customer])).slice(0, 8),
  };
}

export function overviewCsv(model) {
  const rows = [
    ['TỔNG QUAN HOÀN', 'Ngày Việt Nam', model.today],
    ['Chỉ số', 'Giá trị', 'Phạm vi'],
    ['Lịch hôm nay', model.todayRows.length, model.today],
    ['Chờ xác nhận', model.pending, 'Mọi lịch'],
    ['Thực còn giữ từ khách', model.retained, 'Gồm số dư cũ, sau hoàn'],
    ['Thu ròng tháng', model.monthNet, model.month],
    ['Lịch chờ đối soát', model.paymentPending, 'Không gồm lịch đã hủy'],
    ['Yêu cầu đổi lịch đang mở', model.reschedules, 'Chờ/đang xử lý'],
    ['Lịch cần xử lý hoàn', model.refunds, 'Lịch hủy còn tiền, chưa từ chối hoàn'],
    [], ['Ngày giao dịch', 'Tiền thu', 'Tiền hoàn', 'Thu ròng'],
    ...model.days.map(day => [day.day, day.received, day.refunded, day.net]),
    [], ['Dịch vụ', 'Số lịch', 'Tỷ lệ (%)'],
    ...model.services.map(row => [row.name, row.count, row.percent]),
  ];
  const cell = value => {
    const text = String(value ?? '');
    const safe = typeof value === 'number' ? text : (/^[\s]*[=+@\-\t\r]/.test(text) ? "'" + text : text);
    return '"' + safe.replaceAll('"', '""') + '"';
  };
  return '\uFEFF' + rows.map(row => row.map(cell).join(',')).join('\r\n');
}
