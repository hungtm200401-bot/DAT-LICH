import { validBookingDateTime } from "./booking-validation.mjs";
import { privateHeaders } from "./site-admin";

export type FieldErrors = Record<string, string>;

export function formError(fieldErrors: FieldErrors, status = 400) {
  const messages = Object.values(fieldErrors);
  const error = messages.length === 1 ? messages[0] : "Vui lòng kiểm tra các mục được đánh dấu.";
  return Response.json({ error, fieldErrors }, { status, headers: privateHeaders });
}

const value = (input: unknown) => typeof input === "string" ? input.trim() : "";
export const normalizePhone = (phone: unknown) => value(phone).replace(/[\s().\u2010-\u2015-]+/g, "");
export const validPhone = (phone: unknown) => /^\+?\d{7,20}$/.test(normalizePhone(phone));
export function normalizeSmsPhone(input: unknown) {
  const compact = normalizePhone(input);
  const number = compact.startsWith("00") ? "+" + compact.slice(2) : compact;
  const vietnam = /^(?:0|\+?840?)([35789]\d{8})$/.exec(number);
  if (vietnam) return "+84" + vietnam[1];
  return /^\+(?!84)[1-9]\d{6,14}$/.test(number) ? number : "";
}
export function samePhone(original: unknown, candidate: unknown) {
  const stored = normalizePhone(original);
  const supplied = normalizePhone(candidate);
  if (!stored || !supplied) return false;
  if (stored === supplied) return true;
  const canonical = normalizeSmsPhone(stored);
  return Boolean(canonical && canonical === normalizeSmsPhone(supplied));
}
export const validEmail = (email: unknown) => typeof email === "string" && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export function contactErrors(input: Record<string, unknown>, nameField: "name" | "customer") {
  const errors: FieldErrors = {};
  const name = value(input[nameField]);
  if (!name) errors[nameField] = "Vui lòng nhập họ và tên.";
  else if (name.length > 120) errors[nameField] = "Họ tên tối đa 120 ký tự.";
  if (!value(input.phone)) errors.phone = "Vui lòng nhập số điện thoại.";
  else if (!validPhone(input.phone)) errors.phone = "Nhập số điện thoại hợp lệ, gồm 7–20 chữ số.";
  if (value(input.email) && !validEmail(input.email)) errors.email = "Nhập email hợp lệ, ví dụ ten@domain.com.";
  return errors;
}

export function appointmentTimeErrors(date: unknown, time: unknown) {
  const errors: FieldErrors = {};
  if (!validBookingDateTime(date, "00:00")) errors.date = "Vui lòng chọn ngày hẹn hợp lệ.";
  if (!validBookingDateTime("2000-01-01", time)) errors.time = "Vui lòng chọn giờ hẹn hợp lệ (giờ:phút).";
  return errors;
}

export function bookingAddressErrors(input: Record<string, unknown>) {
  const errors: FieldErrors = {};
  if (!value(input.city) || !/^\d+$/.test(String(input.provinceCode ?? ""))) errors.city = "Chọn tỉnh hoặc thành phố trong danh sách.";
  if (!value(input.ward) || !/^\d+$/.test(String(input.wardCode ?? ""))) errors.ward = "Chọn phường hoặc xã thuộc tỉnh, thành phố đã chọn.";
  const address = value(input.address);
  if (!address) errors.address = "Nhập số nhà, tên đường hoặc thôn, xóm.";
  else if (address.length > 300) errors.address = "Địa chỉ tối đa 300 ký tự.";
  if (value(input.locationNote).length > 500) errors.locationNote = "Hướng dẫn đến nhà tối đa 500 ký tự.";
  return errors;
}

export function fieldFrom(error: unknown) {
  if (error && typeof error === "object" && "field" in error && typeof error.field === "string") return error.field;
  return "";
}
