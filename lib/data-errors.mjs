// Drizzle wraps D1 errors. Inspect causes so real constraints remain actionable,
// while SQL text and transaction/customer parameters never reach the UI.
export function dataErrorMessage(error) {
  const messages=[],seen=new Set();
  for(let current=error;current&&typeof current==='object'&&!seen.has(current)&&messages.length<12;current=current.cause){
    seen.add(current);
    if(typeof current.message==='string')messages.unshift(current.message);
  }
  const labels={
    PAYMENT_REFUND_EXCEEDS_RECEIVED:'Khoản hoàn vượt số tiền thực còn giữ của lịch này.',
    PAYMENT_EXCEEDS_TOTAL:'Số tiền thu vượt phần còn phải thanh toán.',
    PAYMENT_CANCELLED:'Lịch đã hủy chỉ có thể ghi nhận hoàn tiền.',
    PAYMENT_APPOINTMENT_MISSING:'Không tìm thấy lịch hẹn. Vui lòng làm mới dữ liệu.',
    PAYMENT_HISTORY_EXISTS:'Lịch có lịch sử thu/hoàn tiền không được xóa. Hãy hủy lịch để giữ chứng từ.',
    PAYMENT_TOTAL_BELOW_RECEIVED:'Tổng chi phí không được thấp hơn số tiền thực còn giữ.',
    PAYMENT_IMMUTABLE:'Giao dịch đã ghi sổ không thể sửa hoặc xóa.',
    PROTECTED_BUSINESS_RECORD:'Dữ liệu nghiệp vụ được giữ để đối soát. Hãy dùng thao tác lưu trữ hoặc cập nhật.',
    PROTECTED_ARCHIVED_APPOINTMENT:'Hãy khôi phục lịch trước khi ghi nhận giao dịch.',
    PROTECTED_RECORD_HISTORY:'Lịch sử thay đổi được bảo toàn.',
    PROTECTED_RESTORE_CONFLICT:'Khung giờ đã có lịch hoặc đã bị chặn. Bản lưu trữ vẫn được giữ nguyên.',
    PROTECTED_BOOKING_CONFLICT:'Khung giờ đã có lịch hoặc đã bị chặn. Vui lòng chọn giờ khác.',
    payment_bank_reference_unique:'Mã giao dịch ngân hàng đã được ghi nhận. Nhập mã riêng của lần chuyển tiền này, không phải tên ngân hàng.',
  };
  for(const message of messages){
    // Only match a database cause, never user values in the outer query wrapper.
    if(/Failed query:|\bparams:/i.test(message))continue;
    for(const [code,label] of Object.entries(labels))if(message.includes(code))return label;
    if(/no such (table|column)|has no column/i.test(message))return 'Cơ sở dữ liệu cần được cập nhật. Hãy chạy migration rồi thử lại.';
  }
  if(messages.some(message=>/Failed query:|\bparams:|D1_ERROR|SQLITE_|constraint failed|syntax error|database is locked/i.test(message)))return 'Không thể lưu dữ liệu lúc này. Vui lòng làm mới và thử lại.';
  return messages.at(-1)||'Không thể xử lý yêu cầu. Vui lòng thử lại.';
}
