# Cache Vite của bản chạy và bản kiểm tra

Kế hoạch sửa: xác định cache đang bị dùng chung, đặt namespace theo đường dẫn
checkout và chế độ chạy, khởi động lại dev server rồi kiểm tra với hai checkout.

Các bản kiểm tra trong `scratch/` có junction `node_modules` trỏ về thư viện của
bản chính. Cache mặc định `node_modules/.vite` vì vậy cũng bị dùng chung.
Metadata cache chính đã chứa đường dẫn tương đối của bản kiểm tra trong scratch;
server giữ URL dependency cũ có thể gặp lỗi thiếu `deps_rsc/react-dom.js`.

`vite.config.ts` đặt cache tại `node_modules/.vite-hoan-<checkout hash>-<command>`.
Hash lấy từ đường dẫn tuyệt đối của file cấu hình; `serve` và `build` tách nhau.
Giữ tiền tố `node_modules/.vite` để tương thích bộ chuyển CommonJS hiện có.
Không đổi phiên bản thư viện, không loại React khỏi optimizer, không tắt overlay.

Kiểm tra thực tế:

- Khởi động lại dev server chính ở `http://localhost:5173/` với `--force` thành công.
- Chạy đồng thời bản kiểm tra tại cổng 5180, cùng junction node_modules, cũng với
  `--force`. Hai cache `e56b908b33ab-serve` và `f91079bcbdd7-serve` khác nhau.
- `npm.cmd run build` đạt trong lúc cả hai dev server đang chạy.
- `verify-admin-settings.mjs` đạt trên cả hai cổng, mỗi cổng kiểm tra 5 viewport,
  lưu/tải lại cấu hình và QR bằng API fixture; không có page error.

Khôi phục cache khi cần: dừng riêng dev server của checkout rồi chạy
`npm.cmd run dev -- --force`. Không xóa node_modules hoặc dữ liệu D1.

Tham khảo: [Vite cacheDir](https://vite.dev/config/shared-options#cachedir),
[dependency pre-bundling](https://vite.dev/guide/dep-pre-bundling).
