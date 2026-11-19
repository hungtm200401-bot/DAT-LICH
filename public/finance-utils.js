// All money is integer VND. Opening entries retain the provenance of old records.
export const financeKinds = { deposit: 'Thu cọc', balance: 'Thu tiền còn lại', refund: 'Hoàn tiền', opening: 'Số dư chuyển sang', opening_refund: 'Khoản hoàn chuyển sang' };
export const isOutflow = entry => entry.kind === 'refund' || entry.kind === 'opening_refund';
export function validateVndAmount(value,label='Số tiền') {
  const amount=Number(value);
  const validType=typeof value==='number'||typeof value==='string'&&/^\d+$/.test(value.trim());
  if(!validType||!Number.isSafeInteger(amount)||amount<0||amount>1000000000)throw new Error(`${label} phải là số nguyên từ 0 đến 1 tỷ đồng.`);
  return amount;
}
export function validateMoneySettings(settings) {
  for(const field of ['deposit','travelFee']){
    if(settings[field]===undefined)continue;
    try { validateVndAmount(settings[field],field==='deposit'?'Mức cọc':'Phí di chuyển'); }
    catch (error) { throw Object.assign(error, { field }); }
  }
}
export function summarizePayments(appointment, entries = []) {
  const rows = entries.filter(entry => entry.appointmentCode === appointment.code);
  const received = rows.filter(entry => !isOutflow(entry)).reduce((sum, entry) => sum + Number(entry.amount), 0);
  const refunded = rows.filter(isOutflow).reduce((sum, entry) => sum + Number(entry.amount), 0);
  const netReceived = received - refunded;
  return { received, refunded, netReceived, remaining: Math.max(0, Number(appointment.total) - netReceived), depositReceived: rows.filter(entry => entry.kind === 'deposit' || entry.kind === 'opening').reduce((sum, entry) => sum + Number(entry.amount), 0), entries: rows };
}
export function validatePayment(input, now = Date.now()) {
  const errorFor = (field, message) => Object.assign(new Error(message), { field });
  if (!['deposit', 'balance', 'refund'].includes(input.kind)) throw errorFor('kind', 'Loại giao dịch không hợp lệ.');
  if(typeof input.amount!=='number'&&(typeof input.amount!=='string'||!/^\d+$/.test(input.amount.trim())))throw errorFor('amount', 'Nhập số tiền nguyên dương.');
  const amount = Number(input.amount);
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 1000000000) throw errorFor('amount', 'Số tiền phải là số nguyên dương, tối đa 1 tỷ đồng.');
  if (!['bank', 'cash'].includes(input.method)) throw errorFor('method', 'Vui lòng chọn chuyển khoản hoặc tiền mặt.');
  const reference = String(input.reference || '').normalize('NFKC').trim();
  if (reference.length > 120) throw errorFor('reference', 'Mã giao dịch tối đa 120 ký tự.');
  if (input.method === 'bank' && !reference) throw errorFor('reference', 'Nhập mã giao dịch ngân hàng để đối soát và tránh ghi trùng.');
  const note = String(input.note || '').trim();
  if (input.kind === 'refund' && !note) throw errorFor('note', 'Vui lòng ghi lý do hoàn tiền.');
  if (note.length > 1000) throw errorFor('note', 'Ghi chú tối đa 1.000 ký tự.');
  const timestamp = Date.parse(input.occurredAt);
  if (!Number.isFinite(timestamp) || timestamp > now + 300000) throw errorFor('occurredAt', 'Thời gian giao dịch không hợp lệ hoặc ở tương lai.');
  const idempotencyKey = String(input.idempotencyKey || '');
  if (!/^[a-zA-Z0-9-]{16,80}$/.test(idempotencyKey)) throw new Error('Thiếu mã chống ghi trùng. Hãy mở lại biểu mẫu.');
  return { kind: input.kind, amount, method: input.method, reference, note, occurredAt: new Date(timestamp).toISOString(), idempotencyKey, confirmAppointment: input.confirmAppointment === true };
}
