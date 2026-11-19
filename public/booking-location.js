import { findProvince, findWard, locationSearchKey, canConfirmLocationPoint, locationAddressSignature, cleanBookingLocation } from './location-utils.js?v=6.0';
import { acquireDevicePosition, checkLocationArea, resolveAddressAtPosition } from './device-location.js?v=6.4';

const positionPoint = ({ coords }) => ({ lat: coords.latitude, lon: coords.longitude, accuracy: coords.accuracy, mode: 'gps' });
const progressMessages = {
  permission: 'Chọn Cho phép trong hộp thoại của trình duyệt để lấy vị trí.',
  locating: 'Đang lấy vị trí từ thiết bị…',
  retrying: 'Đang thử phương thức định vị khác trên thiết bị…',
  refining: 'Đang lấy thêm mẫu để giảm sai số…',
  boundary: 'Đang đối chiếu tỉnh và phường/xã…',
  address: 'Đang tra số nhà và tên đường trong khu vực…',
};

export function createBookingLocation({ getBooking, getService, getSettings, save, render, esc, money, validateAddress, showErrors, clearErrors }) {
  let directory = [], aliases = [], dataStatus = 'loading', loadPromise = null;
  let requestId = 0, controller = null, activeRequestId = 0, activeBooking = null;
  let operationTimer = null, latestAccuracy = null;
  const queries = { city: null, ward: null };
  const root = () => document.querySelector('.booking-location');
  const inputFor = field => root()?.querySelector(`[name="${field}"]`);
  const currentProvince = () => findProvince(directory, inputFor('city')?.value ?? getBooking().city);
  const optionsFor = field => field === 'city' ? directory : currentProvince()?.wards || [];
  const isLocationPage = () => (location.hash.split('?')[0] === '#/booking/location');

  // Keep the address draft; a fresh document never trusts a prior GPS fix.
  clearCoordinates(getBooking());
  Object.assign(getBooking(), { isDetectingLocation: false, locationStage: 'idle', locationError: '', locationMessage: '' });

  function clearCoordinates(booking) {
    Object.assign(booking, { locationCoordinates: null, locationDeviceCoordinates: null, locationCapturedAt: '', locationConfirmedAt: '', locationAddressSignature: '', locationRegion: null, locationSource: '', locationAutofill: null, locationAddressDetails: null, locationVerificationVersion: 0, detectedAddress: '' });
  }

  function closeLists() {
    root()?.querySelectorAll('[role="combobox"]').forEach(input => {
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
      document.getElementById(input.getAttribute('aria-controls')).hidden = true;
    });
  }

  function showOptions(input, all = false) {
    if (input.disabled) return;
    const panel = document.getElementById(input.getAttribute('aria-controls'));
    const field = input.dataset.locationSearch;
    const query = all ? '' : locationSearchKey(input.value);
    const legacyTargets = field === 'ward' && query ? new Set(aliases.filter(item => item.provinceCode === currentProvince()?.code && item.full && item.targets.length === 1 && locationSearchKey(item.name).includes(query)).flatMap(item => item.targets)) : new Set();
    const options = optionsFor(field).filter(item => !query || locationSearchKey(item.name).includes(query) || legacyTargets.has(item.code));
    closeLists();
    panel.innerHTML = options.length ? options.map(item => `<button type="button" role="option" tabindex="-1" id="location-option-${field}-${item.code}" data-location-choice="${field}" data-value="${esc(item.name)}" aria-selected="${getBooking()[field] === item.name}">${esc(item.name)}</button>`).join('') : '<p class="location-no-results">Không tìm thấy. Thử tên khác hoặc bỏ dấu tiếng Việt.</p>';
    panel.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  }

  function setFieldError(input, message = '') {
    input.setCustomValidity(message);
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    const error = document.getElementById(`${input.id}-error`);
    error.textContent = message;
    error.hidden = !message;
  }

  function syncWard() {
    const ward = inputFor('ward');
    if (!ward) return;
    ward.disabled = dataStatus !== 'ready' || !currentProvince();
    ward.placeholder = ward.disabled ? 'Chọn tỉnh/thành phố trước' : 'Chọn phường/xã';
    const toggle = root().querySelector('[data-location-open="ward"]');
    if (toggle) toggle.disabled = ward.disabled;
  }

  function updateStatus() {
    const booking = getBooking(), container = root();
    if (!container) return;
    const button = container.querySelector('[data-location-detect]');
    const busy = Boolean(activeRequestId || booking.isDetectingLocation);
    const stage = booking.locationStage;
    button.disabled = busy || dataStatus !== 'ready';
    button.querySelector('[data-location-button-label]').textContent = busy ? 'Đang định vị…' : 'Dùng vị trí hiện tại';
    button.querySelector('[data-location-spinner]').hidden = !busy;
    button.querySelector('[data-location-gps-icon]').hidden = busy;
    button.classList.toggle('is-loading', busy); button.setAttribute('aria-busy', String(busy));
    container.dataset.locationStage = stage || 'idle';
    container.querySelector('[data-location-cancel]').hidden = !busy;
    const status = container.querySelector('[data-location-status]');
    const message = booking.locationError || (busy && progressMessages[stage]) || booking.locationMessage || '';
    status.hidden = !message;
    if (status.textContent !== message) status.textContent = message;
    status.classList.toggle('is-error', Boolean(booking.locationError));
    container.querySelector('[data-location-feedback]').hidden = !message;
    const accuracy = latestAccuracy ?? booking.locationCoordinates?.accuracy;
    const readout = container.querySelector('[data-location-accuracy]');
    readout.hidden = !Number.isFinite(accuracy) || accuracy <= 0;
    if (!readout.hidden) readout.textContent = `Sai số thiết bị ước tính ±${Math.ceil(accuracy).toLocaleString('vi-VN')} m`;
    const manual = container.querySelector('[data-location-manual]');
    manual.hidden = busy || !['failed', 'partial'].includes(stage);
    manual.textContent = booking.locationAutofill ? 'Bổ sung địa chỉ' : 'Nhập địa chỉ';
    const preview = container.querySelector('[data-location-address-preview]');
    const fullAddress = [booking.address, booking.ward, booking.city].map(value => String(value || '').trim()).filter(Boolean).join(', ');
    preview.hidden = !booking.address || !booking.ward || !booking.city;
    preview.querySelector('[data-location-full-address]').textContent = fullAddress;
    const hint = preview.querySelector('[data-location-address-hint]');
    hint.hidden = !booking.locationAutofill || !booking.address;
    hint.textContent = 'Kiểm tra số nhà, đường và phường/xã rồi bấm Tiếp tục để xác nhận địa chỉ.';
  }

  function cancelRequest() {
    requestId++;
    clearTimeout(operationTimer); operationTimer = null;
    controller?.abort(); controller = null;
    if (activeBooking) activeBooking.isDetectingLocation = false;
    activeRequestId = 0; activeBooking = null;
    latestAccuracy = null;
    getBooking().isDetectingLocation = false;
  }

  function resetLocationConfirmation(sync = true) {
    const booking = getBooking();
    const hadLocation = Boolean(booking.locationCoordinates || activeRequestId);
    cancelRequest(); clearCoordinates(booking);
    Object.assign(booking, { locationStage: 'manual', locationError: '', locationMessage: hadLocation ? 'Địa chỉ đã thay đổi. Đặt lịch sẽ dùng địa chỉ bạn nhập.' : '' });
    if (sync) updateStatus();
  }

  function commit(input, report = false) {
    const field = input.dataset.locationSearch, booking = getBooking();
    const match = field === 'city' ? findProvince(directory, input.value) : findWard(currentProvince(), input.value, aliases);
    if (!match) {
      if (report) setFieldError(input, field === 'city' ? 'Chọn tỉnh/thành phố trong danh sách.' : 'Chọn phường/xã thuộc tỉnh/thành phố đã chọn.');
      return false;
    }
    if (booking[field] !== match.name) {
      resetLocationConfirmation(false);
      booking[field] = match.name;
      booking[field === 'city' ? 'provinceCode' : 'wardCode'] = match.code;
      if (field === 'city') {
        booking.ward = ''; booking.wardCode = null; booking.district = '';
        queries.ward = null;
        const ward = inputFor('ward');
        ward.value = '';
        setFieldError(ward);
      }
    }
    input.value = match.name;
    queries[field] = null;
    setFieldError(input);
    syncWard();
    save();
    updateStatus();
    return true;
  }

  async function load() {
    if (loadPromise) return loadPromise;
    dataStatus = 'loading';
    let aliasRequest;
    const loadAliases = () => aliasRequest ||= fetch('/data/vietnam-ward-aliases.json', { signal: AbortSignal.timeout(10000) })
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (Array.isArray(data?.aliases)) aliases = data.aliases; })
      .catch(() => {});
    loadPromise = fetch('/data/vietnam-administrative-latest.json', { signal: AbortSignal.timeout(10000) })
      .then(async response => {
        if (!response.ok) throw new Error('Directory unavailable');
        const data = await response.json();
        if (!Array.isArray(data) || data.length !== 34 || data.some(province => !Array.isArray(province.wards) || !province.wards.length)) throw new Error('Incomplete directory');
        directory = data;
        const saved = getBooking();
        if (saved.ward && !findWard(findProvince(directory, saved.city), saved.ward)) await loadAliases();
        const booking = getBooking();
        const province = findProvince(directory, booking.city);
        const ward = findWard(province, booking.ward, aliases);
        Object.assign(booking, { city: province?.name || '', provinceCode: province?.code || null, ward: ward?.name || '', wardCode: ward?.code || null, district: '' });
        if (!province || !ward) booking.detectedAddress = '';
        dataStatus = 'ready';
        save();
      }).catch(() => { dataStatus = 'error'; loadPromise = null; }).finally(() => {
        if (isLocationPage()) render();
        if (dataStatus === 'ready') void loadAliases();
      });
    return loadPromise;
  }

  function field(field, label, placeholder) {
    const booking = getBooking(), disabled = dataStatus !== 'ready' || (field === 'ward' && !findProvince(directory, booking.city));
    const value = queries[field] ?? booking[field] ?? '';
    return `<div class="location-field" data-location-field="${field}">
      <label for="booking-${field}">${label} <span aria-hidden="true">*</span></label>
      <div class="location-combobox">
        <input id="booking-${field}" type="text" name="${field}" value="${esc(value)}" placeholder="${disabled && field === 'ward' ? 'Chọn tỉnh/thành phố trước' : placeholder}" data-location-search="${field}" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="location-${field}-options" aria-describedby="booking-${field}-error" autocomplete="off" spellcheck="false" required ${disabled ? 'disabled' : ''}>
        <button type="button" class="location-select-toggle" data-location-open="${field}" tabindex="-1" aria-label="${esc(placeholder)}" ${disabled ? 'disabled' : ''}><span aria-hidden="true"></span></button>
        <div id="location-${field}-options" class="location-options" role="listbox" aria-label="${label}" hidden></div>
      </div>
      <small id="booking-${field}-error" class="location-field-error" hidden></small>
    </div>`;
  }

  function html() {
    const booking = getBooking(), service = getService();
    const travelFee = Math.max(0, Number(getSettings().travelFee ?? 50000) || 0);
    booking.travelFee = travelFee;
    return `<h1 class="ct-title">Địa điểm trang điểm</h1><p class="ct-subtitle">Cho Hoàn biết địa chỉ bạn muốn được phục vụ.</p>
      <section class="booking-location">
        <div class="location-setup">
          <div class="location-toolbar">
            <div><h2>Địa chỉ phục vụ</h2><p>Vui lòng cung cấp địa chỉ để chuyên viên đến đúng địa điểm.</p></div>
            <div class="location-gps-actions">
              <button type="button" class="btn location-detect-button" data-location-detect aria-busy="false" ${dataStatus !== 'ready' ? 'disabled' : ''}>
                <svg data-location-gps-icon width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 1v4m0 14v4M1 12h4m14 0h4"/></svg>
                <span class="location-button-spinner" data-location-spinner aria-hidden="true" hidden></span>
                <span data-location-button-label>Dùng vị trí hiện tại</span>
              </button>
            </div>
          </div>
          <div class="location-feedback" data-location-feedback hidden>
            <p data-location-status role="status" aria-live="polite" hidden></p>
            <div class="location-feedback-actions">
              <p data-location-accuracy hidden></p>
              <button type="button" class="location-cancel" data-location-cancel hidden>Dừng và nhập địa chỉ</button>
              <button type="button" class="location-cancel" data-location-manual hidden>Nhập địa chỉ</button>
            </div>
          </div>
        </div>
${dataStatus !== 'ready' ? `<p class="location-data-status" role="status">${dataStatus === 'error' ? 'Chưa tải được danh sách địa chỉ. <button type="button" data-location-retry>Thử lại</button>' : 'Đang tải danh sách địa chỉ…'}</p>` : ''}
        <form class="ct-form location-form" data-form="location" novalidate>
          <div class="location-field-row">${field('city', 'Tỉnh / Thành phố', 'Chọn tỉnh/thành phố')}${field('ward', 'Phường / Xã', 'Chọn phường/xã')}</div>
          <div class="location-field"><label for="booking-address">Số nhà, đường / thôn, xóm <span aria-hidden="true">*</span></label><input id="booking-address" type="text" name="address" value="${esc(booking.address || '')}" placeholder="Số nhà, ngõ/ngách, tên đường hoặc thôn, xóm" autocomplete="street-address" required maxlength="300"></div>
          <div class="location-field"><label for="booking-location-note">Căn hộ, tầng hoặc hướng dẫn đến nhà <span class="location-optional">(không bắt buộc)</span></label><input id="booking-location-note" type="text" name="locationNote" value="${esc(booking.locationNote || '')}" placeholder="Tên tòa nhà, số căn hộ, tầng, cổng vào…" maxlength="500"></div>
          <div class="location-address-preview" data-location-address-preview hidden><span class="location-address-caption">Địa chỉ dùng để đặt lịch</span><p data-location-full-address></p><p class="location-address-hint" data-location-address-hint hidden></p></div>
          <p class="location-form-error" data-location-form-error role="alert" hidden></p>
          <dl class="location-cost"><div><dt>${esc(service.name)}</dt><dd>${service.contact ? 'Trao đổi trực tiếp' : money(service.price)}</dd></div><div><dt>Phí di chuyển</dt><dd>${money(travelFee)}</dd></div>${!service.contact ? `<div class="location-cost-total"><dt>Tổng chi phí</dt><dd>${money(service.price + travelFee)}</dd></div>` : ''}</dl>
        </form><p class="location-share-note">Hoàn sẽ dùng địa chỉ bạn xác nhận để đến đúng nơi.</p>
      </section>`;
  }

  async function detectLocation() {
    if (dataStatus !== 'ready' || activeRequestId) return;
    const booking = getBooking();
    const previousAutomatic = { ...booking.locationAutofill };
    clearCoordinates(booking);
    latestAccuracy = null;
    const id = ++requestId;
    activeRequestId = id; activeBooking = booking;
    controller = new AbortController();
    const signal = controller.signal;
    const stillCurrent = () => id === requestId && activeRequestId === id && booking === getBooking() && isLocationPage();
    const finish = (error = '', message = '', stage = error ? 'failed' : 'resolved') => {
      if (!stillCurrent()) return;
      clearTimeout(operationTimer); operationTimer = null;
      activeRequestId = 0; activeBooking = null; controller = null;
      Object.assign(booking, { isDetectingLocation: false, locationStage: stage, locationError: error, locationMessage: message });
      save(); updateStatus();
    };
    const manual = (error = '', message = '') => { if (stillCurrent()) { clearCoordinates(booking); finish(error, message, error ? 'failed' : 'partial'); } };
    Object.assign(booking, { isDetectingLocation: true, locationStage: 'locating', locationError: '', locationMessage: '' });
    save(); updateStatus();
    operationTimer = setTimeout(() => {
      if (!stillCurrent()) return;
      controller?.abort(); manual('Định vị quá thời gian. Bạn có thể nhập địa chỉ hoặc thử lại.');
    }, 45000);
    if (!navigator.geolocation) return manual('Trình duyệt chưa hỗ trợ định vị. Vui lòng nhập địa chỉ.');
    if (!window.isSecureContext) return manual('Định vị cần HTTPS hoặc localhost. Bạn vẫn có thể nhập địa chỉ.');
    if (navigator.onLine === false) return manual('Mất kết nối mạng. Vui lòng nhập địa chỉ hoặc thử lại khi có mạng.');
    let position, preparedArea;
    try {
      position = await acquireDevicePosition(navigator.geolocation, signal, measurement => {
        if (!stillCurrent()) return;
        latestAccuracy = measurement.coords.accuracy;
        const point = positionPoint(measurement);
        if (!preparedArea && navigator.onLine !== false && canConfirmLocationPoint(point)) {
          preparedArea = { position: measurement, lookup: checkLocationArea(directory, point, signal) };
        }
        updateStatus();
      }, stage => {
        if (!stillCurrent()) return;
        booking.locationStage = stage; updateStatus();
      }, { permissions: navigator.permissions });
    } catch (error) {
      if (!stillCurrent()) return;
      return manual(error.code === 1 ? 'Quyền định vị đang bị chặn. Hãy bật quyền Vị trí của trang hoặc nhập địa chỉ.' : error.code === 3 ? 'Định vị quá thời gian. Bạn có thể nhập địa chỉ hoặc thử lại.' : 'Chưa lấy được vị trí. Vui lòng nhập địa chỉ hoặc thử lại.');
    }
    if (!stillCurrent()) return;
    const point = positionPoint(position);
    if (!canConfirmLocationPoint(point)) return manual('', 'Tín hiệu vị trí còn yếu. Vui lòng nhập địa chỉ phục vụ.');
    if (navigator.onLine === false) return manual('Mất kết nối mạng. Vui lòng nhập địa chỉ hoặc thử lại khi có mạng.');
    booking.locationStage = 'boundary'; updateStatus();
    let result;
    try {
      result = await resolveAddressAtPosition(directory, point, signal, {
        areaLookup: preparedArea?.position === position ? preparedArea.lookup : undefined,
        onReverseLookup() {
          if (stillCurrent()) { booking.locationStage = 'address'; updateStatus(); }
        },
      });
    }
    catch { return manual('Chưa tra được địa chỉ. Bạn vẫn có thể nhập thủ công.'); }
    if (!stillCurrent()) return;
    if (result.mismatch) return manual('', 'Dữ liệu địa chỉ không khớp. Vui lòng chọn tỉnh/phường và nhập địa chỉ.');
    if (!result.area || !result.reliable) return manual('', 'Chưa xác định chắc chắn tỉnh/phường. Vui lòng nhập địa chỉ.');
    const proposed = { city: result.area.city, ward: result.area.ward, address: result.address || '' };
    const manualConflict = Object.keys(proposed).some(field => {
      const value = String(inputFor(field)?.value ?? booking[field] ?? '').trim();
      return value && value !== previousAutomatic[field] && value !== proposed[field].trim();
    });
    if (manualConflict) return manual('', 'Đã giữ địa chỉ bạn nhập. Vui lòng kiểm tra rồi tiếp tục.');
    Object.assign(booking, proposed, {
      provinceCode: result.area.provinceCode, wardCode: result.area.wardCode, district: '',
      locationAutofill: { ...proposed }, locationAddressDetails: result.addressDetails || null,
    });
    if (proposed.address) {
      Object.assign(booking, {
        locationCoordinates: point, locationDeviceCoordinates: { ...point }, locationCapturedAt: new Date(position.timestamp).toISOString(),
        locationRegion: { provinceCode: result.area.provinceCode, wardCode: result.area.wardCode },
        locationSource: 'administrative-boundaries', locationVerificationVersion: 2,
      });
      booking.locationAddressSignature = locationAddressSignature(booking);
    }
    queries.city = null; queries.ward = null;
    for (const field of ['city', 'ward', 'address']) {
      const input = inputFor(field); if (!input) continue;
      input.value = booking[field]; input.setCustomValidity('');
      if (field !== 'address') setFieldError(input);
    }
    syncWard(); closeLists();
    if (result.addressDetails?.precision === 'house') finish('', 'Đã gợi ý địa chỉ từ vị trí hiện tại.');
    else finish('', booking.address ? 'Đã gợi ý một phần địa chỉ. Hãy kiểm tra, bổ sung số nhà hoặc lối vào nếu có.' : 'Đã điền tỉnh/phường. Hãy bổ sung số nhà, đường hoặc thôn/xóm.', 'partial');
  }

  function focusManualAddress() {
    const fields = ['city', 'ward', 'address'].map(inputFor);
    (fields.find(input => input && !input.disabled && !input.value.trim()) || inputFor('address'))?.focus();
  }

  async function validate() {
    const form = root()?.querySelector('form');
    if (!form) return false;
    const error = form.querySelector('[data-location-form-error]');
    if (getBooking().isDetectingLocation) { error.hidden = false; error.textContent = 'Đang định vị. Dừng định vị để tiếp tục nhập tay.'; root().querySelector('[data-location-cancel]')?.focus(); return false; }
    error.hidden = dataStatus === 'ready';
    if (dataStatus !== 'ready') { error.textContent = 'Vui lòng tải lại danh sách địa chỉ trước khi tiếp tục.'; return false; }
    const address = inputFor('address');
    const booking = getBooking();
    clearErrors(form);
    const cityValid = commit(inputFor('city'));
    const wardValid = cityValid && commit(inputFor('ward'));
    const submitted = {
      city: inputFor('city').value, provinceCode: cityValid ? booking.provinceCode : null,
      ward: inputFor('ward').value, wardCode: wardValid ? booking.wardCode : null,
      address: address.value.trim(), locationNote: inputFor('locationNote').value,
    };
    try {
      await validateAddress(submitted);
    } catch (reason) { showErrors(form, reason); return false; }
    if (!form.isConnected) return false;
    if (['city', 'ward', 'address', 'locationNote'].some(field => inputFor(field).value.trim() !== submitted[field].trim())) {
      error.textContent = 'Địa chỉ vừa thay đổi. Bấm Tiếp tục để xác nhận thông tin mới.';
      error.hidden = false;
      return false;
    }
    // Some browser autofill paths change the DOM without an input event.
    // Confirm and submit the visible address, never a stale draft value.
    if (String(booking.address || '').trim() !== address.value.trim()) clearCoordinates(booking);
    booking.address = submitted.address;
    booking.locationNote = submitted.locationNote;
    const signature = locationAddressSignature(booking);
    const regionMatches = booking.locationRegion?.provinceCode === booking.provinceCode && booking.locationRegion?.wardCode === booking.wardCode;
    if (signature && signature === booking.locationAddressSignature && regionMatches && canConfirmLocationPoint(booking.locationCoordinates)) booking.locationConfirmedAt = new Date().toISOString();
    else clearCoordinates(booking);
    save(); return true;
  }

  document.addEventListener('input', event => {
    if (!event.target.closest('.booking-location')) return;
    const input = event.target;
    if (input.matches('[data-location-search]')) {
      queries[input.dataset.locationSearch] = input.value;
      setFieldError(input); resetLocationConfirmation();
      if (input.name === 'city') syncWard();
      showOptions(input);
    } else if (input.name === 'address' || input.name === 'locationNote') {
      if (input.name === 'address') { input.setCustomValidity(''); resetLocationConfirmation(); }
      getBooking()[input.name] = input.value; save(); updateStatus();
    }
  });
  document.addEventListener('change', event => {
    if (event.target.matches('.booking-location [data-location-search]')) commit(event.target);
  });
  document.addEventListener('focusin', event => {
    if (event.target.matches('.booking-location [data-location-search]')) showOptions(event.target, queries[event.target.name] === null);
  });
  document.addEventListener('focusout', event => {
    const field = event.target.closest('[data-location-field]');
    if (field && !field.contains(event.relatedTarget)) { commit(field.querySelector('input')); closeLists(); }
  });
  document.addEventListener('mousedown', event => {
    if (event.target.closest('[data-location-choice]')) event.preventDefault();
  });
  document.addEventListener('keydown', event => {
    const input = event.target;
    if (!input.matches('.booking-location [data-location-search]')) return;
    let panel = document.getElementById(input.getAttribute('aria-controls'));
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) && (!panel.hidden || event.key.startsWith('Arrow'))) {
      event.preventDefault();
      if (panel.hidden) showOptions(input, true);
      const options = [...panel.querySelectorAll('[role="option"]')];
      if (!options.length) return;
      const active = options.findIndex(option => option.id === input.getAttribute('aria-activedescendant'));
      const index = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : event.key === 'ArrowDown' ? (active + 1) % options.length : (active <= 0 ? options.length : active) - 1;
      options.forEach((option, i) => option.classList.toggle('is-highlighted', i === index));
      input.setAttribute('aria-activedescendant', options[index].id);
      options[index].scrollIntoView({ block: 'nearest', behavior: 'instant' });
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const active = document.getElementById(input.getAttribute('aria-activedescendant'));
      const only = panel.querySelectorAll('[role="option"]');
      if (active || only.length === 1) input.value = (active || only[0]).dataset.value;
      commit(input, true); closeLists();
    } else if (event.key === 'Escape') {
      event.preventDefault(); input.value = getBooking()[input.name] || ''; queries[input.name] = null;
      setFieldError(input); closeLists(); syncWard();
    } else if (event.key === 'Tab') { commit(input); closeLists(); }
  });
  document.addEventListener('click', event => {
    const choice = event.target.closest('[data-location-choice]');
    const toggle = event.target.closest('[data-location-open]');
    if (choice) {
      const input = inputFor(choice.dataset.locationChoice);
      input.value = choice.dataset.value; commit(input, true); input.focus({ preventScroll: true }); closeLists();
    } else if (toggle) {
      const input = inputFor(toggle.dataset.locationOpen), wasOpen = input.getAttribute('aria-expanded') === 'true';
      input.focus({ preventScroll: true }); if (wasOpen) closeLists(); else showOptions(input, true);
    } else if (event.target.closest('[data-location-detect]')) { closeLists(); detectLocation(); }
    else if (event.target.closest('[data-location-cancel]')) {
      resetLocationConfirmation(false);
      getBooking().locationMessage = 'Định vị đã dừng. Bạn có thể nhập địa chỉ.';
      save(); updateStatus(); focusManualAddress();
    }
    else if (event.target.closest('[data-location-manual]')) focusManualAddress();
    else if (event.target.closest('[data-location-retry]')) { load(); render(); }
    else if (!event.target.closest('[data-location-field]')) closeLists();
  });

  return {
    html, load, validate,
    sanitize() {
      if (!cleanBookingLocation(getBooking()).locationCoordinates) clearCoordinates(getBooking());
    },
    beforeRender(path) {
      if (activeRequestId && (activeBooking !== getBooking() || path !== '/booking/location')) {
        cancelRequest(); clearCoordinates(getBooking()); getBooking().locationMessage = ''; save();
      }
    },
    mount(path) {
      if (path !== '/booking/location') return;
      updateStatus(); syncWard();
    }
  };
}
