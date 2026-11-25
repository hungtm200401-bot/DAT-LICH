# Build contract
- `npm run ipa:check`: kiểm tra target Sources, unittest Python, Bash syntax khi có Bash.
- `npm run ipa:build`: kiểm tra trước, dùng workflow hiện tại và tải IPA đã xác minh. `--help` không cần token.
- Windows `scripts/windows/TAO_IPA.bat`: gọi lệnh build tại root.
- Mac `bash ios/build-ipa.sh [output.ipa]` và `--signed`: preflight, build riêng + log, validate app, sign/verify, ZIP + manifest trước publish.
- Validator required plist keys, no unresolved settings, executable trong bundle, ARM64 platform device; archive không duplicate/path traversal và khớp Info/executable sau ký.
- Signed exporter giữ Xcode signature, đối chiếu Team/environment trước manifest; không ký ad-hoc lại.
- CI luôn tải diagnostics kể cả build lỗi. Không công bố artifact IPA nếu script lỗi.
