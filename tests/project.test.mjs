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
