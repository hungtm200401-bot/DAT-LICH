# Validation
Chạy `npm run ipa:check`, kiểm tra IPA đã có bằng validator, rồi build thật `npm run ipa:build` từ nhánh đã commit/push. CI cần Xcode, Simulator và Python có sẵn. IPA + JSON trong IPA/, logs trong outputs/hoan-admin-app/ios/build; workflow diagnostics giữ cả lỗi. Không dùng kết quả này làm bằng chứng Push đã hoạt động.
## Actual results
Chưa chốt: 15 unittest fixture đã đạt trên Windows; preflight thấy đủ 5 Swift. Ghi kết quả CI sau khi thực thi.
