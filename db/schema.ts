import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const services = sqliteTable("services", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  duration: integer("duration").notNull(),
  price: integer("price").notNull(),
  description: text("description").notNull().default(""),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  contact: integer("contact", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const appointments = sqliteTable("appointments", {
  code: text("code").primaryKey(),
  customer: text("customer").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull().default(""),
  serviceId: text("service_id").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  locationType: text("location_type").notNull().default("client"),
  address: text("address").notNull().default(""),
  district: text("district").notNull().default(""),
  ward: text("ward").notNull().default(""),
  style: text("style").notNull().default(""),
  note: text("note").notNull().default(""),
  total: integer("total").notNull(),
  deposit: integer("deposit").notNull().default(0),
  paymentStatus: text("payment_status").notNull().default("unverified"),
  status: text("status").notNull().default("pending"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("appointments_date_idx").on(table.date),
  index("appointments_phone_idx").on(table.phone),
  index("appointments_status_idx").on(table.status),
]);

export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull().default(""),
  visits: integer("visits").notNull().default(0),
  spent: integer("spent").notNull().default(0),
  note: text("note").notNull().default(""),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("customers_phone_unique").on(table.phone)]);

export const scheduleSlots = sqliteTable("schedule_slots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slotDate: text("slot_date").notNull(),
  slotTime: text("slot_time").notNull(),
  status: text("status").notNull().default("available"),
  note: text("note").notNull().default(""),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("schedule_date_time_unique").on(table.slotDate, table.slotTime),
  index("schedule_date_idx").on(table.slotDate),
]);

export const siteContent = sqliteTable("site_content", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const visitSessions = sqliteTable("visit_sessions", {
  id: text("id").primaryKey(),
  startedAt: text("started_at").notNull(),
  lastSeenAt: text("last_seen_at").notNull(),
  source: text("source").notNull(),
  medium: text("medium").notNull().default(""),
  campaign: text("campaign").notNull().default(""),
  referrer: text("referrer").notNull().default(""),
  device: text("device").notNull().default(""),
  browser: text("browser").notNull().default(""),
  landingPage: text("landing_page").notNull(),
  currentPage: text("current_page").notNull(),
  activeSeconds: integer("active_seconds").notNull().default(0),
  displayName: text("display_name").notNull().default(""),
  facebookUrl: text("facebook_url").notNull().default(""),
  declaredPurpose: text("declared_purpose").notNull().default(""),
}, (table) => [
  index("visit_sessions_seen").on(table.lastSeenAt),
  index("visit_sessions_source").on(table.source, table.startedAt),
]);

export const visitEvents = sqliteTable("visit_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: text("session_id").notNull(),
  occurredAt: text("occurred_at").notNull(),
  type: text("type").notNull(),
  page: text("page").notNull(),
  label: text("label").notNull().default(""),
}, (table) => [
  index("visit_events_session").on(table.sessionId, table.id),
]);
