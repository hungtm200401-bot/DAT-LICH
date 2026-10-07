import { eq, like } from "drizzle-orm";
import { getDb } from "../../../db";
import { siteContent } from "../../../db/schema";
import { siteAdmin, privateHeaders } from "../../../lib/site-admin";

const PUBLIC_PREFIX = "cms:";
const DRAFT_PREFIX = "cms-draft:";
const HISTORY_PREFIX = "cms-history:";
const BLOCK_TYPES = new Set(["text", "image", "split", "gallery", "features", "process", "testimonial", "faq", "cta"]);
const BLOCK_SETTINGS = {
  width: new Set(["narrow", "standard", "wide", "full"]),
  spacing: new Set(["compact", "normal", "airy"]),
  theme: new Set(["white", "soft", "dark", "wine"]),
  align: new Set(["left", "center"]),
  ratio: new Set(["auto", "landscape", "portrait", "square"]),
  imagePosition: new Set(["left", "right", "top", "background"]),
  columns: new Set(["2", "3", "4"]),
};

const validPath = (path: unknown): path is string =>
  typeof path === "string" && /^\/(?:[a-z0-9/-]{0,100})$/.test(path) && !path.startsWith("/admin");
const validImage = (value: string) => !value || /^(?:\/(?!\/)|https:\/\/)[^\s<>"']+$/.test(value);
const validLink = (value: string) => !value || /^(?:#\/[a-z0-9/?=&_-]*|https:\/\/[^\s<>"']+|mailto:[^\s<>"']+|tel:[+0-9 ()-]+)$/.test(value);

function readJson<T>(value: string, fallback: T): T {
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

function pageMap(rows: Array<{ key: string; value: string }>, prefix: string) {
  return Object.fromEntries(rows.map(row => [row.key.slice(prefix.length), readJson(row.value, {})]));
}

function validateBlocks(value: string) {
  const blocks = readJson<unknown>(value || "[]", null);
  if (!Array.isArray(blocks) || blocks.length > 30) return "Danh sách section không hợp lệ.";
  for (const source of blocks) {
    if (!source || typeof source !== "object") return "Section không hợp lệ.";
    const block = source as Record<string, unknown>;
    if (typeof block.id !== "string" || block.id.length > 100 || !BLOCK_TYPES.has(String(block.type))) return "Loại section không hợp lệ.";
    for (const field of ["eyebrow", "title", "text", "image", "alt", "caption", "buttonLabel", "buttonHref"]) {
      if (block[field] !== undefined && (typeof block[field] !== "string" || block[field].length > 6000)) return "Nội dung section quá dài.";
    }
    if (!validImage(String(block.image || ""))) return "Ảnh trong section phải dùng đường dẫn nội bộ hoặc HTTPS.";
    if (!validLink(String(block.buttonHref || ""))) return "Liên kết trong section không hợp lệ.";
    if (block.slot !== undefined && (!Number.isInteger(block.slot) || Number(block.slot) < 0 || Number(block.slot) > 40)) return "Vị trí section không hợp lệ.";
    if (block.hidden !== undefined && typeof block.hidden !== "boolean") return "Trạng thái section không hợp lệ.";
    if (block.settings !== undefined) {
      if (!block.settings || typeof block.settings !== "object" || Array.isArray(block.settings)) return "Thiết lập section không hợp lệ.";
      for (const [key, allowed] of Object.entries(BLOCK_SETTINGS)) {
        const setting = (block.settings as Record<string, unknown>)[key];
        if (setting !== undefined && (typeof setting !== "string" || !allowed.has(setting))) return "Thiết lập trình bày không hợp lệ.";
      }
    }
    if (block.items !== undefined) {
      if (!Array.isArray(block.items) || block.items.length > 12) return "Danh sách nội dung trong section không hợp lệ.";
      for (const item of block.items) {
        if (!item || typeof item !== "object" || Array.isArray(item)) return "Mục nội dung không hợp lệ.";
        for (const field of ["title", "text"]) {
          const content = (item as Record<string, unknown>)[field];
          if (typeof content !== "string" || content.length > 3000) return "Mục nội dung quá dài.";
        }
      }
    }
    if (block.images !== undefined) {
      if (!Array.isArray(block.images) || block.images.length > 8) return "Bộ sưu tập ảnh không hợp lệ.";
      for (const image of block.images) {
        if (!image || typeof image !== "object" || Array.isArray(image)) return "Ảnh trong bộ sưu tập không hợp lệ.";
        const entry = image as Record<string, unknown>;
        if (typeof entry.src !== "string" || !validImage(entry.src)) return "Đường dẫn ảnh trong bộ sưu tập không hợp lệ.";
        for (const field of ["alt", "caption"]) {
          const content = entry[field];
          if (content !== undefined && (typeof content !== "string" || content.length > 1000)) return "Mô tả ảnh quá dài.";
        }
      }
    }
  }
  return "";
}

function validateFields(fields: unknown) {
  if (!fields || Array.isArray(fields) || typeof fields !== "object" || Object.keys(fields).length > 200) return "Nội dung không hợp lệ.";
  for (const [key, value] of Object.entries(fields)) {
    if (!/^[a-z0-9_-]{1,100}$/.test(key) || typeof value !== "string" || value.length > (key === "blocks" ? 120000 : 6000)) return "Trường nội dung không hợp lệ.";
    if (key === "blocks") {
      const error = validateBlocks(value);
      if (error) return error;
    } else if (key.startsWith("img-") && !validImage(value)) return "Ảnh phải dùng đường dẫn nội bộ hoặc HTTPS.";
  }
  return "";
}

export async function GET(request: Request) {
  const db = getDb();
  const url = new URL(request.url);
  const historyPath = url.searchParams.get("history");
  if (historyPath !== null) {
    if (!await siteAdmin(request)) return Response.json({ error: "Cần quyền quản trị để xem lịch sử." }, { status: 401, headers: privateHeaders });
    if (!validPath(historyPath)) return Response.json({ error: "Trang không hợp lệ." }, { status: 400, headers: privateHeaders });
    const [row] = await db.select().from(siteContent).where(eq(siteContent.key, HISTORY_PREFIX + historyPath));
    return Response.json({ history: row ? readJson(row.value, []) : [] }, { headers: privateHeaders });
  }
  const rows = await db.select().from(siteContent).where(like(siteContent.key, "cms:/%"));
  const result: Record<string, unknown> = { pages: pageMap(rows, PUBLIC_PREFIX) };
  if (url.searchParams.get("admin") === "1") {
    if (!await siteAdmin(request)) return Response.json({ error: "Cần quyền quản trị để xem bản nháp." }, { status: 401, headers: privateHeaders });
    const drafts = await db.select().from(siteContent).where(like(siteContent.key, "cms-draft:/%"));
    result.drafts = pageMap(drafts, DRAFT_PREFIX);
  }
  return Response.json(result, { headers: privateHeaders });
}

export async function POST(request: Request) {
  if (!await siteAdmin(request)) return Response.json({ error: "Cần khóa quản trị để lưu nội dung." }, { status: 401, headers: privateHeaders });
  const raw = await request.text();
  if (raw.length > 350000) return Response.json({ error: "Nội dung quá lớn." }, { status: 413, headers: privateHeaders });
  try {
    const { action = "publish", path, fields, revision } = JSON.parse(raw);
    if (!validPath(path)) return Response.json({ error: "Trang không hợp lệ." }, { status: 400, headers: privateHeaders });
    const validationError = validateFields(fields);
    if (validationError) return Response.json({ error: validationError }, { status: 400, headers: privateHeaders });
    const db = getDb();
    const publishedKey = PUBLIC_PREFIX + path;
    const draftKey = DRAFT_PREFIX + path;
    const [current] = await db.select().from(siteContent).where(eq(siteContent.key, publishedKey));
    const published = current ? readJson<{ revision?: string }>(current.value, {}) : { revision: "" };

    if (action === "draft") {
      if ((revision || "") !== (published.revision || "")) return Response.json({ error: "Website đã có phiên bản mới. Tải lại trước khi tiếp tục sửa." }, { status: 409, headers: privateHeaders });
      const savedDraft = { fields, baseRevision: revision || "", updatedAt: new Date().toISOString() };
      await db.insert(siteContent).values({ key: draftKey, value: JSON.stringify(savedDraft), updatedAt: savedDraft.updatedAt })
        .onConflictDoUpdate({ target: siteContent.key, set: { value: JSON.stringify(savedDraft), updatedAt: savedDraft.updatedAt } });
      return Response.json({ draft: savedDraft }, { headers: privateHeaders });
    }

    if (action !== "publish") return Response.json({ error: "Thao tác không hợp lệ." }, { status: 400, headers: privateHeaders });
    if ((revision || "") !== (published.revision || "")) return Response.json({ error: "Trang đã được sửa ở cửa sổ khác. Tải lại nội dung trước khi xuất bản." }, { status: 409, headers: privateHeaders });
    const page = { fields, revision: crypto.randomUUID(), updatedAt: new Date().toISOString() };
    if (current) {
      const result = await db.update(siteContent).set({ value: JSON.stringify(page), updatedAt: page.updatedAt })
        .where(eq(siteContent.value, current.value)).returning({ key: siteContent.key });
      if (!result.length) return Response.json({ error: "Nội dung vừa thay đổi. Vui lòng tải lại." }, { status: 409, headers: privateHeaders });
      const historyKey = HISTORY_PREFIX + path;
      const [historyRow] = await db.select().from(siteContent).where(eq(siteContent.key, historyKey));
      const history = historyRow ? readJson<Array<Record<string, unknown>>>(historyRow.value, []) : [];
      history.unshift({ ...readJson(current.value, {}), archivedAt: page.updatedAt });
      const historyValue = JSON.stringify(history.slice(0, 30));
      await db.insert(siteContent).values({ key: historyKey, value: historyValue, updatedAt: page.updatedAt })
        .onConflictDoUpdate({ target: siteContent.key, set: { value: historyValue, updatedAt: page.updatedAt } });
    } else {
      const result = await db.insert(siteContent).values({ key: publishedKey, value: JSON.stringify(page) }).onConflictDoNothing().returning({ key: siteContent.key });
      if (!result.length) return Response.json({ error: "Nội dung vừa thay đổi. Vui lòng tải lại." }, { status: 409, headers: privateHeaders });
    }
    await db.delete(siteContent).where(eq(siteContent.key, draftKey));
    return Response.json({ page }, { headers: privateHeaders });
  } catch {
    return Response.json({ error: "Không thể lưu nội dung. Kiểm tra dữ liệu và thử lại." }, { status: 400, headers: privateHeaders });
  }
}
