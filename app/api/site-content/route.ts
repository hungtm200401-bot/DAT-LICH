import { eq, like } from "drizzle-orm";
import { getDb } from "../../../db";
import { siteContent } from "../../../db/schema";
import { siteAdmin, privateHeaders } from "../../../lib/site-admin";

export async function GET() {
  const rows = await getDb().select().from(siteContent).where(like(siteContent.key, "cms:/%"));
  return Response.json({ pages: Object.fromEntries(rows.map(row => [row.key.slice(4), JSON.parse(row.value)])) }, { headers: privateHeaders });
}

export async function POST(request: Request) {
  if (!await siteAdmin(request)) return Response.json({ error: "Cần khóa quản trị để lưu nội dung." }, { status: 401 });
  const raw = await request.text();
  if (raw.length > 180000) return Response.json({ error: "Nội dung quá lớn." }, { status: 413 });
  try {
    const { path, fields, revision } = JSON.parse(raw);
    if (typeof path !== "string" || !/^\/(?:[a-z0-9/-]{0,100})$/.test(path) || path.startsWith("/admin") || !fields || Array.isArray(fields) || typeof fields !== "object" || Object.keys(fields).length > 200)
      return Response.json({ error: "Trang hoặc nội dung không hợp lệ." }, { status: 400 });
    for (const [key, value] of Object.entries(fields)) {
      if (!/^[a-z0-9_-]{1,100}$/.test(key) || typeof value !== "string" || value.length > (key === "blocks" ? 30000 : 6000))
        return Response.json({ error: "Trường nội dung không hợp lệ (tối đa 6.000 ký tự)." }, { status: 400 });
      if (key === "blocks") {
        const blocks = JSON.parse(value || "[]");
        if (!Array.isArray(blocks) || blocks.length > 30) return Response.json({ error: "Danh sách khối nội dung không hợp lệ." }, { status: 400 });
        for (const block of blocks) {
          if (!block || typeof block !== "object" || !["text", "image"].includes(block.type)) return Response.json({ error: "Khối nội dung không hợp lệ." }, { status: 400 });
          for (const field of ["title", "text", "image", "alt", "caption"]) {
            if (block[field] !== undefined && (typeof block[field] !== "string" || block[field].length > 6000)) return Response.json({ error: "Nội dung khối quá dài." }, { status: 400 });
          }
          if (block.image && !/^(?:\/(?!\/)|https:\/\/)[^\s<>"']+$/.test(block.image)) return Response.json({ error: "Ảnh trong khối phải dùng đường dẫn /assets/… hoặc HTTPS." }, { status: 400 });
        }
        continue;
      }
      if (key.startsWith("img-") && value && !/^(?:\/(?!\/)|https:\/\/)[^\s<>"']+$/.test(value))
        return Response.json({ error: "Ảnh phải dùng đường dẫn /assets/… hoặc HTTPS." }, { status: 400 });
    }
    const db = getDb();
    const key = "cms:" + path;
    const [current] = await db.select().from(siteContent).where(eq(siteContent.key, key));
    const old = current ? JSON.parse(current.value) : { revision: "" };
    if ((revision || "") !== old.revision) return Response.json({ error: "Trang đã được sửa ở cửa sổ khác. Tải lại nội dung trước khi lưu." }, { status: 409 });
    const page = { fields, revision: crypto.randomUUID(), updatedAt: new Date().toISOString() };
    if (current) {
      const result = await db.update(siteContent).set({ value: JSON.stringify(page), updatedAt: page.updatedAt })
        .where(eq(siteContent.value, current.value)).returning({ key: siteContent.key });
      if (!result.length) return Response.json({ error: "Nội dung vừa thay đổi. Vui lòng tải lại." }, { status: 409 });
    } else {
      const result = await db.insert(siteContent).values({ key, value: JSON.stringify(page) }).onConflictDoNothing().returning({ key: siteContent.key });
      if (!result.length) return Response.json({ error: "Nội dung vừa thay đổi. Vui lòng tải lại." }, { status: 409 });
    }
    return Response.json({ page }, { headers: privateHeaders });
  } catch {
    return Response.json({ error: "Không thể lưu nội dung. Kiểm tra dữ liệu và thử lại." }, { status: 400 });
  }
}
