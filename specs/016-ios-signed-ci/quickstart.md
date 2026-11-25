# Validation
1. `node scripts/check-ios-build.mjs`: fixture cũ và signing mới; cú pháp Bash.
2. actionlint kiểm workflow mới.
3. Push branch: job checks trên macOS chạy kiểm tra; không dùng bộ ký.
4. Chạy workflow_dispatch không có secrets: job ký phải fail trước import/build và không có artifact IPA.
5. Với bộ ký thật: import, validate, archive/export/codesign, đối chiếu profile nhúng và manifest; cài trên iPhone đã đăng ký, bật Push và thử khi đã vuốt tắt app.

## Actual results
Windows: 40 unittest, 39 PASS và 1 skip kiểm keychain thật trên macOS. Preflight thấy đủ 5 Swift; Bash syntax 4 script PASS; actionlint v1.7.12 (official release, checksum verified) PASS cho cả hai workflow. Test fixture đã chạy trước implementation và ban đầu fail thiếu module. Chưa build ký Apple hoặc thử Push thật vì chưa có đầu vào Apple. Kết quả runner sẽ được bổ sung sau khi chạy.
