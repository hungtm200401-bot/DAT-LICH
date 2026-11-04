export function createAdminSettings({ getState, esc, icon, paymentQR }) {
  const groups = [
    ['booking', 'calendar', 'Đặt lịch & chi phí', 'Lịch mở và mức phí'],
    ['bank', 'card', 'Tài khoản nhận tiền', 'Ngân hàng và mã QR'],
    ['contact', 'mail', 'Thông tin liên hệ', 'Hotline, Zalo và email'],
    ['address', 'pin', 'Địa chỉ đặt lịch', 'Cách khách gửi địa chỉ'],
  ];
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-settings-jump]');
    if (!button) return;
    const section = document.getElementById('settings-' + button.dataset.settingsJump);
    if (!section) return;
    if (section.tagName === 'DETAILS') section.open = true;
    section.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    section.querySelector('input,summary')?.focus({ preventScroll: true });
  });
  document.addEventListener('input', event => {
    const form = event.target.closest('.settings-main-form');
    if (!form || !['bankName', 'bankAccount', 'bankOwner'].includes(event.target.name)) return;
    const ready = ['bankName', 'bankAccount', 'bankOwner'].every(name => form.elements.namedItem(name)?.value.trim());
    const badge = form.querySelector('[data-settings-bank-state]');
    badge.classList.toggle('is-ready', ready);
    badge.querySelector('span').textContent = ready ? 'Đã nhập đủ thông tin tài khoản' : 'Chưa đủ thông tin tài khoản';
  });
  function content() {
    const { settings: s = {}, brand: b = {} } = getState();
    const seedBank = s.bankAccount === '0901234567' && s.bankOwner === 'NGUYEN HOAN';
    const input = (name, label, { type = 'text', hint = '', unit = '', value = s[name] ?? '', placeholder = '', numeric = false, min = 0 } = {}) => `<div class="settings-field">
      <label for="setting-${name}">${label}</label>
      <div class="settings-input-wrap"><input id="setting-${name}" name="${name}" type="${type}" value="${esc(value)}" placeholder="${esc(placeholder)}" ${type === 'number' ? `min="${min}" step="1"` : ''} ${numeric ? 'inputmode="numeric"' : ''} ${hint ? `aria-describedby="setting-${name}-hint"` : ''}>${unit ? `<span>${unit}</span>` : ''}</div>
      ${hint ? `<small id="setting-${name}-hint">${hint}</small>` : ''}</div>`;
    const heading = (number, ico, title, desc) => `<header class="settings-card-head"><span class="settings-card-icon" aria-hidden="true">${icon(ico)}</span><div><h2>${title}</h2><p>${desc}</p></div><span class="settings-number" aria-hidden="true">${number}</span></header>`;
    const qr = paymentQR();
    const bankFilled = !seedBank && s.bankName && s.bankAccount && s.bankOwner;
    return `<div class="settings-workspace">
      <aside class="settings-aside"><nav aria-label="Nhóm cài đặt"><span class="settings-eyebrow">THIẾT LẬP CHUNG</span>${groups.map(([id, ico, title, desc]) => `<button type="button" data-settings-jump="${id}" aria-controls="settings-${id}"><span aria-hidden="true">${icon(ico)}</span><span><b>${title}</b><small>${desc}</small></span></button>`).join('')}</nav><p class="settings-timezone">${icon('clock')}<span>Giờ Việt Nam<b>GMT+7 · Ngày / Tháng / Năm</b></span></p></aside>
      <div class="settings-sections">
        <form data-form="settings" class="settings-main-form">
          <section id="settings-booking" class="settings-card">
            ${heading('01', 'calendar', 'Đặt lịch & chi phí', 'Thiết lập áp dụng cho các lịch hẹn mới.')}
            <div class="settings-fields settings-fields-three">
              ${input('bookingWindow', 'Mở lịch trước', { type: 'number', unit: 'ngày', min: 1, hint: 'Khoảng thời gian khách có thể đặt lịch.' })}
              ${input('deposit', 'Mức cọc tiêu chuẩn', { type: 'number', unit: 'VNĐ', hint: 'Được trừ vào tổng chi phí dịch vụ.' })}
              ${input('travelFee', 'Phí di chuyển mặc định', { type: 'number', unit: 'VNĐ', hint: 'Phí di chuyển áp dụng khi đặt lịch.' })}
            </div>
          </section>
          <section id="settings-bank" class="settings-card">
            ${heading('02', 'card', 'Tài khoản nhận tiền', 'Thông tin chuyển khoản hiển thị cho khách khi đặt cọc.')}
            <div class="settings-bank-layout"><div><span class="settings-state ${bankFilled ? 'is-ready' : ''}" data-settings-bank-state><i></i><span>${bankFilled ? 'Đã nhập đủ thông tin tài khoản' : 'Chưa đủ thông tin tài khoản'}</span></span>
              <div class="settings-fields settings-fields-two">
                ${input('bankName', 'Ngân hàng', { placeholder: 'Tên ngân hàng' })}
                ${input('bankCode', 'Mã ngân hàng VietQR', { placeholder: 'Ví dụ: MB, VCB' })}
                ${input('bankAccount', 'Số tài khoản', { value: seedBank ? '' : s.bankAccount ?? '', numeric: true, placeholder: 'Nhập số tài khoản' })}
                ${input('bankOwner', 'Chủ tài khoản', { value: seedBank ? '' : s.bankOwner ?? '', placeholder: 'Tên chủ tài khoản' })}
              </div><p class="settings-note">${icon('shield')}<span>Kiểm tra đúng ngân hàng, số tài khoản và tên người nhận trước khi lưu.</span></p>
            </div><div class="settings-qr"><h3>Mã QR nhận tiền</h3><p>Ảnh QR gốc từ ứng dụng ngân hàng.</p><div class="settings-qr-preview">${qr || `<div class="settings-qr-empty">${icon('image')}<b>Chưa có ảnh QR</b><span>Tải ảnh để khách quét chuyển khoản</span></div>`}</div>
              <label class="settings-upload">${icon('upload')}<span>${qr ? 'Thay ảnh QR' : 'Tải ảnh QR'}</span><input type="file" accept="image/png,image/jpeg,image/webp" data-payment-qr aria-label="Tải hoặc thay ảnh QR nhận tiền"></label><small>PNG, JPG, WebP · Tối đa 5 MB<br>Ảnh được lưu ngay sau khi tải lên.</small>
            </div></div>
          </section>
          <footer class="settings-save"><p>${icon('shield')}<span>Lưu để áp dụng thiết lập đặt lịch và tài khoản nhận tiền.</span></p><button type="submit" class="btn btn-dark">${icon('check')} Lưu thiết lập</button></footer>
        </form>
        <form id="settings-contact" class="settings-card" data-form="contact-settings">
          ${heading('03', 'mail', 'Thông tin liên hệ', 'Kênh khách hàng sử dụng để liên hệ và nhận tư vấn.')}
          <div class="settings-fields settings-fields-two">
            ${input('phone', 'Số điện thoại / Zalo', { type: 'tel', value: b.phone === '0901 234 567' ? '' : b.phone ?? '', placeholder: 'Số điện thoại liên hệ' })}
            ${input('email', 'Email', { type: 'email', value: b.email ?? '', placeholder: 'Email nhận liên hệ' })}
          </div><footer class="settings-contact-save"><span>Thông tin hiển thị trên website của bạn.</span><button type="submit" class="btn">Lưu thông tin liên hệ</button></footer>
        </form>
        <details id="settings-address" class="settings-card settings-address"><summary><span class="settings-card-icon" aria-hidden="true">${icon('pin')}</span><span><b>Địa chỉ đặt lịch</b><small>Cách khách nhập và xác nhận địa chỉ phục vụ</small></span><span class="settings-details-arrow" aria-hidden="true">${icon('chevron')}</span></summary><div class="settings-address-body">${window.HoanMapSettings?.html() || '<p>Khách có thể nhập địa chỉ thủ công hoặc dùng vị trí hiện tại để nhận gợi ý, sau đó kiểm tra và xác nhận địa chỉ.</p>'}</div></details>
      </div>
    </div>`;
  }
  return { content };
}
