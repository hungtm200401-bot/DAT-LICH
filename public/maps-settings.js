export function createMapsSettings() {
  function html() {
    return `<section class="manage-card maps-settings-form" data-maps-settings>
      <h2>Địa chỉ đặt lịch</h2>
      <p>Khách nhập địa chỉ hoặc bấm <strong>Dùng vị trí hiện tại</strong> để nhận gợi ý. Trang đặt lịch không hiển thị bản đồ và không cần API key.</p>
      <p>Khách kiểm tra địa chỉ rồi bấm Tiếp tục để xác nhận. Sửa tỉnh, phường/xã hoặc địa chỉ đường sẽ hủy tọa độ GPS cũ.</p>
      <p>Bản đồ OpenFreeMap trong quản trị chỉ dùng xem điểm phục vụ đã được xác nhận. Không có cấu hình bản đồ cần nhập.</p>
    </section>`;
  }
  return { html, mount() {} };
}
