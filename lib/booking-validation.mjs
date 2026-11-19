const DAY = 86400000;
export function validBookingDateTime(date, time) {
  if (typeof date !== 'string' || typeof time !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) return false;
  const day = Date.parse(date + 'T00:00:00Z');
  return Number.isFinite(day) && new Date(day).toISOString().slice(0, 10) === date;
}
/** @param {string} date @param {string} time @param {unknown} [bookingWindow] @param {number} [now] */
export function bookingTimeError(date, time, bookingWindow = 60, now = Date.now()) {
  if (!validBookingDateTime(date, time)) return 'Ngày hoặc giờ hẹn không hợp lệ.';
  const instant = Date.parse(date + 'T' + time + ':00+07:00');
  if (!Number.isFinite(instant) || instant <= now) return 'Vui lòng chọn thời gian trong tương lai.';
  const windowDays = Number(bookingWindow);
  if (!Number.isInteger(windowDays) || windowDays < 1 || windowDays > 3650) return 'Cửa sổ đặt lịch chưa được cấu hình hợp lệ.';
  const vietnamDay = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(now));
  const lastDay = Date.parse(vietnamDay + 'T00:00:00Z') + windowDays * DAY;
  if (Date.parse(date + 'T00:00:00Z') > lastDay) return `Chỉ nhận lịch trong ${windowDays} ngày tới.`;
  return '';
}
