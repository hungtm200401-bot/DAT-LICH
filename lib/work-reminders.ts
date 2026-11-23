import { validBookingDateTime } from "./booking-validation.mjs";

const day = 24 * 60 * 60 * 1000;

type WorkAppointment = {
  code: string;
  date: string;
  time: string;
  status: string;
  archivedAt: string | null;
};

export function workReminders(appointments: WorkAppointment[], now = Date.now()) {
  const reminders: { code: string; startsAt: number; remindAt: number }[] = [];
  for (const appointment of appointments) {
    if (appointment.status !== "confirmed" || appointment.archivedAt ||
        !validBookingDateTime(appointment.date, appointment.time)) continue;
    const startsAt = Date.parse(`${appointment.date}T${appointment.time}:00+07:00`);
    if (startsAt > now) reminders.push({ code: appointment.code, startsAt, remindAt: startsAt - day });
  }
  return reminders.sort((a, b) => a.remindAt - b.remindAt || a.code.localeCompare(b.code));
}
