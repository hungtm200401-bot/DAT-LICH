# Kiểm tra Web Push

Chạy `npm test` để build và kiểm tra dự án. Sau khi build, chạy `node scripts/verify-admin-web-push.mjs` để kiểm tra Web Push trên D1 cô lập với máy nhận mô phỏng. Thêm `--browser` khi máy đã có Playwright và Edge theo cấu hình kiểm thử của dự án để kiểm tra các nút bật, gửi thử và tắt.

Trên iPhone, mở quản trị online bằng Safari và chọn **Chia sẻ → Thêm vào Màn hình chính**. Mở biểu tượng HOÀN, đăng nhập, bấm **Bật thông báo** rồi chọn **Cho phép**. Bấm **Gửi thử** để xác nhận thông báo hiển thị trên iPhone. [Quản trị HOÀN online](https://hoan-makeup-artist.hoan-makeup.workers.dev/#/admin)
