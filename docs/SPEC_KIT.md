# Spec Kit cho HOÀN Makeup và các dự án khác

Dự án dùng [GitHub Spec Kit v1.2.6](https://github.com/github/spec-kit/releases/tag/v1.2.6)
với tích hợp Codex, skill theo repo và script PowerShell. Công cụ không tham gia
runtime, build, database hoặc trang web của khách hàng.

## Máy khác kéo repo này về

Sau khi các file thiết lập đã được commit và push, `git clone`/`git pull` sẽ nhận:

- `AGENTS.md`: hướng dẫn Codex chọn quy trình theo quy mô công việc.
- `.agents/skills/speckit-*`: các skill chính thức của Spec Kit.
- `.specify/`: script, template, workflow và nguyên tắc của dự án.
- `.gitattributes`: giữ kiểu xuống dòng của file Spec Kit khi đổi máy.
- `specs/`: tài liệu các tính năng khi bắt đầu triển khai chúng.

Mở repo bằng Codex. Nếu chưa thấy skill mới, mở lại phiên Codex. Những skill dùng
script PowerShell cần Windows PowerShell/PowerShell tương thích; repo hiện chọn
`--script ps`. Các bước SDD cơ bản dùng file và script đã có trong repo, không
buộc cài CLI lại chỉ để đọc hướng dẫn, tạo spec/plan/tasks và triển khai.
Các lệnh quản lý integration/extension/workflow của `specify` vẫn cần CLI.

Nếu muốn có CLI và lệnh dùng chung trên máy Windows mới, mở `CAI_SPEC_KIT.bat`
một lần, hoặc chạy từ thư mục gốc repo:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup-spec-kit.ps1 -ToolsOnly -InstallSharedCommand
```

Bộ cài dùng uv 0.13.6 từ nguồn chính thức, kiểm tra SHA-256 của installer, rồi
cài CLI từ tag v1.2.6. uv tái sử dụng Python 3.12 hoặc tự tải nếu thiếu. Công cụ
được cài cho tài khoản Windows, dùng chung giữa các repo; cần Internet ở lần đầu.
Không cần quyền quản trị hệ thống. Các thư mục cache và môi trường công cụ nằm
ngoài repo, không cần đưa chúng lên Git.

## Dự án khác trên cùng máy

Mở lại terminal sau lần cài đầu, rồi chạy:

```powershell
speckit-project "D:\Projects\DuAnKhac"
```

Hoặc đứng ở thư mục gốc dự án đó và chạy `speckit-project`.
Thư mục dự án phải tồn tại. Lệnh tái sử dụng CLI đã cài, thêm cấu hình riêng và
nguyên tắc chung; không mang nghiệp vụ HOÀN Makeup sang dự án khác. `AGENTS.md`
hiện có được giữ lại và bổ sung hướng dẫn. Cấu hình Spec Kit đã có được giữ nguyên;
trường hợp thiếu hoặc xung đột file sẽ báo lỗi để kiểm tra thay vì ghi đè.
Đường dẫn có khoảng trắng được hỗ trợ. Tránh các ký tự `[` và `]` trong tên
thư mục vì script PowerShell tạo tính năng của Spec Kit hiện xử lý sai các ký tự đó;
bộ thiết lập sẽ báo lỗi trước khi thêm file.

Sau khi khởi tạo, xem diff và commit/push các file thiết lập cùng dự án mới.
Máy khác kéo dự án đó về cũng có cấu hình sẵn. Không thể tự thay đổi những dự án
chưa được chỉ định; mỗi repo mới chỉ cần chạy lệnh khởi tạo này một lần.

Trên macOS/Linux, cài CLI dùng chung bằng uv theo tài liệu chính thức và chọn
script phù hợp khi khởi tạo repo khác. Bộ cài `.bat`/`.ps1` ở đây dành cho Windows;
không chạy lại `init --force` lên repo đã có cấu hình để đổi hệ điều hành.

## Cách dùng hằng ngày

Có thể yêu cầu bằng tiếng Việt bình thường, ví dụ:

> Thêm xuất danh sách lịch hẹn theo bộ lọc hiện tại. Áp dụng Spec Kit, giữ nguyên
> phân quyền và chỉ xuất những dòng quản trị viên đang được phép xem.

Codex đọc `AGENTS.md` và chọn skill phù hợp. Có thể gọi trực tiếp trong chat:

```text
$speckit-specify Thêm chức năng xuất danh sách lịch hẹn theo bộ lọc hiện tại
$speckit-plan
$speckit-tasks
$speckit-implement
$speckit-converge
```

`$speckit-clarify`, `$speckit-checklist`, `$speckit-analyze` dùng khi cần làm rõ và
kiểm tra tài liệu. Các lệnh `$speckit-*` dành cho chat Codex, không phải terminal.
Không cần chạy quy trình đầy đủ cho sửa chữ, đổi màu hoặc lỗi nhỏ độc lập.

Chưa chọn một tính năng mới nên chưa tạo spec giả hoặc đánh dấu tính năng hoàn tất.
`.specify/feature.json` là con trỏ tính năng riêng của từng checkout, được bỏ qua
trong Git. Sau khi kéo code, dùng `$speckit-specify` cho tính năng mới; để tiếp tục
tính năng đã có, yêu cầu Codex chọn thư mục `specs/<feature>` tương ứng.

## Cập nhật công cụ

Phiên bản được cố định để các máy nhận cùng một bộ template. Không tự cập nhật
theo `main`. Khi nâng cấp, cập nhật phiên bản có chủ đích, dùng lệnh upgrade của
Spec Kit, xem diff và chạy lại kiểm tra trước khi chia sẻ qua Git. Không sửa trực
tiếp các skill/script do Spec Kit sinh ra.

Nguồn: [cài đặt](https://github.github.io/spec-kit/installation.html),
[dự án có sẵn](https://github.github.io/spec-kit/guides/existing-projects.html),
[tích hợp Codex](https://github.github.io/spec-kit/integrations/codex.html),
[skill trong Codex](https://learn.chatgpt.com/docs/build-skills).
