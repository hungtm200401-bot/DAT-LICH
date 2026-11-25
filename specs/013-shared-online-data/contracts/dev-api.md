# Shared dev API contract

`npm run dev`: online; `npm run dev:local` / `--local`: isolated local. Không cho mode ngoài online|local. Direct Vite CLI mặc định local cho CI.

`GET /__hoan/runtime`: no-store `{version:1,mode,origin}` trên loopback, không secret. Reuse server chỉ khi mode+origin+checkout+build trùng; mismatch yêu cầu restart.

`/api/*` trong shared mode: path/query/method/body/status nguyên nghĩa, stream binary/multipart; chỉ target production cố định được cấu hình vào Vite app. Mọi method được upstream hiện tại quyết định. Chỉ credentials cookie whitelist được chuyển, không cookie local cũ. Upstream Set-Cookie whitelist được alias riêng trên local; giữ expiry, HttpOnly và SameSite Strict, không Domain hoặc Secure cho HTTP loopback. Origin/Referer upstream chỉ được viết lại sau guard inbound.

Guard: chỉ loopback binding/socket/Host; Host phải khớp cổng đang nghe. Origin nếu có phải đúng origin request; Referer nếu có cùng origin. Sec-Fetch-Site chỉ same-origin|none hoặc thiếu cho CLI. Host DNS rebinding/forwarded/Origin ngoài bị 403 trước khi gửi upstream. API/runtime không enable CORS. Shared mode không gắn D1/R2 local; biến thể đường dẫn mã hóa hoặc dot-segments có thể né rule rồi normalize thành API bị từ chối; module Windows mã hóa vẫn được phục vụ local. Chỉ Location cùng upstream origin được remap về local; Location ngoại origin hoặc không hợp lệ trả JSON 502, không đưa redirect cho browser để tránh phát lại POST chứa khóa/dữ liệu. Không follow redirect ở proxy. Timeout/lỗi mạng 502/504 JSON `error`, no-store; không fallback/retry.

Mọi response dev API có `X-Hoan-Data-Source: online` và origin metadata; frontend dùng cho nhãn, không cho phân quyền. Local mode có descriptor riêng; production HTML/API không thay đổi.

Out of scope: nhập lịch local cũ, đổi mật khẩu, triển khai Worker/APNs, remote DB token, offline writes, Web Push local, Google console permissions.
