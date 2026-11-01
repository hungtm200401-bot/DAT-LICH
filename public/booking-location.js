import { findProvince, findWard, locationSearchKey, distanceMeters, canConfirmLocationPoint } from './location-utils.js?v=5.0';
import { acquireDevicePosition, resolveAddressAtPosition } from './device-location.js?v=6.1';
import { mountLocationMap } from './location-map.js?v=8.2';
import { administrativeMapBounds } from './location-boundaries.js?v=3.0';

export function createBookingLocation({ getBooking, getService, getSettings, save, render, esc, money }) {
  let directory = [], aliases = [], dataStatus = 'loading', loadPromise = null;
  let requestId = 0, controller = null, activeRequestId = 0, activeBooking = null;
  let mapCleanup = () => {}, mapElement = null, mapKey = '', mapAbort = null, mapGeneration = 0;
  let mapSnapshot = null, boundsAbort = null, mapFocus = null;
  const queries = { city: null, ward: null };
  const root = () => document.querySelector('.booking-location');
  const inputFor = field => root()?.querySelector(`[name="${field}"]`);
  const currentProvince = () => findProvince(directory, inputFor('city')?.value ?? getBooking().city);
  const optionsFor = field => field === 'city' ? directory : currentProvince()?.wards || [];
  const isLocationPage = () => (location.hash.split('?')[0] === '#/booking/location');

  // A new form never treats a saved GPS measurement or pin as a fresh fix.
  clearAutofilledAddress(getBooking());
  Object.assign(getBooking(), { locationCoordinates: null, locationDeviceCoordinates: null, locationCapturedAt: '', locationConfirmedAt: '', locationRegion: null, locationSource: '', locationAutofill: null, locationAddressDetails: null, locationVerificationVersion: 0, detectedAddress: '', isDetectingLocation: false, locationStage: 'idle', locationError: '', locationMessage: '' });

  function clearAutofilledAddress(booking) {
    if (booking.locationSource !== 'administrative-boundaries') return;
    const previous = booking.locationAutofill || { city: booking.city, ward: booking.ward, address: booking.detectedAddress === [booking.address, booking.ward, booking.city].filter(Boolean).join(', ') ? booking.address : undefined };
    for (const field of ['city', 'ward', 'address']) if (previous[field] !== undefined && booking[field] === previous[field]) booking[field] = '';
    if (!booking.city) booking.provinceCode = null;
    if (!booking.ward || !booking.city) { booking.ward = ''; booking.wardCode = null; }
    booking.locationAutofill = null; booking.locationAddressDetails = null; booking.detectedAddress = '';
    queries.city = null; queries.ward = null;
    for (const field of ['city', 'ward', 'address']) { const input = inputFor(field); if (input) input.value = booking[field] || ''; }
    syncWard();
  }

  function clearMap() {
    mapGeneration++;
    mapAbort?.abort(); mapAbort = null;
    boundsAbort?.abort(); boundsAbort = null;
    const cleanup = mapCleanup;
    mapCleanup = () => {}; mapElement = null; mapKey = ''; mapSnapshot = null; mapFocus = null;
    cleanup();
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

  function updateStatus(forceCenter = false) {
    const booking = getBooking(), container = root();
    if (!container) return;
    const button = container.querySelector('[data-location-detect]');
    const busy = Boolean(activeRequestId || booking.isDetectingLocation);
    const stage = booking.locationStage || (busy ? 'locating' : 'idle');
    const stageLabels = { permission: 'Đang chờ quyền truy cập vị trí', locating: 'Đang xác định vị trí', retrying: 'Đang thử lại tự động', refining: 'Đang cải thiện độ chính xác', address: 'Đang đối chiếu địa chỉ' };
    button.disabled = busy || dataStatus !== 'ready';
    const label = button.querySelector('[data-location-button-label]');
    const buttonText = busy ? stage === 'address' ? 'Đang tra địa chỉ…' : stage === 'refining' ? 'Đang lấy vị trí chính xác…' : stage === 'retrying' ? 'Đang thử lại…' : 'Đang lấy vị trí…' : stage === 'failed' ? 'Thử định vị lại' : booking.locationCoordinates ? 'Lấy lại vị trí' : 'Dùng vị trí hiện tại';
    if (label) { if (label.textContent !== buttonText) label.textContent = buttonText; } else button.textContent = buttonText;
    const spinner = button.querySelector('[data-location-spinner]');
    if (spinner) spinner.hidden = !busy;
    button.classList.toggle('is-loading', busy);
    button.setAttribute('aria-busy', String(busy));
    container.dataset.locationStage = stage;
    const progress = container.querySelector('[data-location-progress]');
    if (progress) {
      progress.hidden = !busy;
      const title = progress.querySelector('[data-location-stage]');
      const detail = progress.querySelector('[data-location-stage-detail]');
      const stageText = stageLabels[stage] || 'Đang xử lý vị trí';
      if (title.textContent !== stageText) title.textContent = stageText;
      if (detail.textContent !== (booking.locationMessage || '')) detail.textContent = booking.locationMessage || '';
    }
    container.querySelector('[data-location-cancel]').hidden = !busy;
    const status = container.querySelector('[data-location-status]');
    status.hidden = busy || (!booking.locationError && !booking.locationMessage);
    status.textContent = booking.locationError || booking.locationMessage || '';
    status.classList.toggle('is-error', Boolean(booking.locationError));
    const manual = container.querySelector('[data-location-manual]');
    const regionMatches = Boolean(booking.locationRegion && booking.locationRegion.provinceCode === booking.provinceCode && booking.locationRegion.wardCode === booking.wardCode);
    if (manual) manual.hidden = !booking.locationCoordinates || regionMatches || booking.isDetectingLocation;
    const map = container.querySelector('[data-location-map]');
    const coordinates = booking.locationCoordinates;
    map.hidden = !coordinates || booking.isDetectingLocation;
    if (coordinates) map.href = `https://www.google.com/maps?q=${encodeURIComponent(coordinates.lat + ',' + coordinates.lon)}`;
    const attribution = container.querySelector('[data-location-attribution]');
    const source = booking.locationSource;
    attribution.hidden = !coordinates || !source || booking.isDetectingLocation;
    if (source) {
      attribution.textContent = source === 'administrative-boundaries' ? 'Ranh giới hành chính: tinhthanhpho.com · CC BY 4.0' : 'Địa chỉ từ OpenStreetMap';
      attribution.href = source === 'administrative-boundaries' ? 'https://www.tinhthanhpho.com/en/api-docs' : 'https://www.openstreetmap.org/copyright';
    }
    const mapContainer = container.querySelector('[data-location-map-panel]');
    const pendingChanged = mapContainer.dataset.locationBusy !== String(busy);
    const confirmed = Boolean(coordinates && booking.locationConfirmedAt && regionMatches && canConfirmLocationPoint(coordinates));
    const confirmationChanged = mapContainer.dataset.locationConfirmed !== String(confirmed);
    mapContainer.dataset.locationBusy = String(busy);
    mapContainer.dataset.locationConfirmed = String(confirmed);
    const summary = container.querySelector('[data-location-coordinate-summary]');
    if (summary) {
      summary.hidden = !coordinates;
      summary.textContent = coordinates ? `${coordinates.mode === 'pin' ? booking.locationConfirmedAt ? 'Ghim đã xác nhận' : 'Ghim đang chọn — chưa xác nhận' : canConfirmLocationPoint(coordinates) ? booking.locationConfirmedAt ? 'Vị trí thiết bị đã xác nhận' : 'Vị trí thiết bị — cần kiểm tra' : 'Vị trí thiết bị gần đúng'} · ${coordinates.lat.toFixed(6)}, ${coordinates.lon.toFixed(6)}${coordinates.mode !== 'pin' && coordinates.accuracy ? ` · Sai số ±${Math.ceil(coordinates.accuracy)} m` : ''}` : '';
    }
    const addressPreview = container.querySelector('[data-location-address-preview]');
    if (addressPreview) {
      const fullAddress = [booking.address, booking.ward, booking.city].map(value => String(value || '').trim()).filter(Boolean).join(', ');
      addressPreview.hidden = !fullAddress;
      const line = addressPreview.querySelector('[data-location-full-address]');
      if (line.textContent !== fullAddress) line.textContent = fullAddress;
      const hint = addressPreview.querySelector('[data-location-address-hint]');
      const details = booking.locationAddressDetails;
      const automatic = booking.locationAutofill && booking.address === booking.locationAutofill.address;
      const message = automatic && details ? details.precision === 'house' ? 'Kiểm tra lại số nhà, ngõ/ngách và thông tin căn hộ hoặc tầng trước khi tiếp tục.' : details.precision === 'street' ? 'Bản đồ chưa xác định được số nhà tại điểm này. Bổ sung số nhà, ngõ/ngách hoặc tên thôn, xóm nếu có.' : 'Chưa có địa chỉ nhà tại điểm này. Nhập số nhà, tên đường hoặc thôn, xóm ở trên.' : '';
      hint.hidden = !message;
      if (hint.textContent !== message) hint.textContent = message;
    }
    mapContainer.hidden = false;
    {
      const region = !coordinates && booking.provinceCode && queries.city === null && queries.ward === null ? [booking.provinceCode, booking.wardCode] : null;
      const key = JSON.stringify([coordinates, booking.locationDeviceCoordinates, region]);
      const newMap = mapElement !== mapContainer;
      if (newMap) {
        clearMap(); mapElement = mapContainer;
        mapAbort = new AbortController();
        const generation = mapGeneration;
        const usePin = mapContainer.querySelector('[data-location-use-pin]'); usePin.disabled = true;
        const signal = mapAbort.signal;
        // Draw immediately; province geometry must never delay the map controls.
        mountLocationMap(mapContainer, coordinates, point => detectLocation(point), { signal, devicePoint: booking.locationDeviceCoordinates, onSelectionChange: point => {
          const current = getBooking();
          cancelRequest(); clearAutofilledAddress(current);
          Object.assign(current, { locationCoordinates: point, locationConfirmedAt: '', locationRegion: null, locationSource: '', locationError: '', locationMessage: 'Ghim mới chưa được xác nhận. Kiểm tra đúng địa điểm rồi bấm “Dùng vị trí này”.' });
          save(); updateStatus();
        } }).then(cleanup => {
          if (generation !== mapGeneration || !mapContainer.isConnected) cleanup();
          else { mapCleanup = cleanup; if (mapSnapshot) { cleanup.update?.(mapSnapshot); mapSnapshot.forceCenter = false; } }
        }).catch(() => { if (generation === mapGeneration && mapContainer.isConnected) mapContainer.querySelector('[data-location-pin-status]').textContent = 'Chưa tải được bản đồ. Bạn có thể mở liên kết bản đồ phía trên hoặc chọn địa chỉ bên dưới.'; });
      }
      if (newMap || key !== mapKey) {
        mapKey = key;
        boundsAbort?.abort(); boundsAbort = null;
        mapSnapshot = { point: coordinates, devicePoint: booking.locationDeviceCoordinates, bounds: null, regionKey: region ? region.join(':') : '' };
        mapCleanup.update?.(mapSnapshot);
        if (region) {
          boundsAbort = new AbortController();
          const signal = boundsAbort.signal, generation = mapGeneration;
          administrativeMapBounds(...region, { signal }).then(bounds => {
            if (signal.aborted || generation !== mapGeneration || !mapElement?.isConnected) return;
            mapSnapshot.bounds = bounds;
            mapCleanup.update?.(mapSnapshot);
          }).catch(() => { /* The current map and manual address remain usable. */ });
        }
      }
      if (forceCenter && mapSnapshot) {
        mapSnapshot.forceCenter = true;
        if (mapCleanup.update) { mapCleanup.update(mapSnapshot); mapSnapshot.forceCenter = false; }
      }
      if ((pendingChanged || confirmationChanged) && mapSnapshot) mapCleanup.update?.(mapSnapshot);
    }
  }

  function cancelRequest() {
    requestId++;
    activeRequestId = 0; activeBooking = null;
    controller?.abort();
    controller = null;
    getBooking().isDetectingLocation = false;
    getBooking().locationStage = 'cancelled';
  }

  function resetLocationConfirmation(preservePoint = false, sync = true) {
    const booking = getBooking();
    const keep = preservePoint && !booking.isDetectingLocation && booking.locationRegion?.provinceCode === booking.provinceCode && booking.locationRegion?.wardCode === booking.wardCode;
    cancelRequest();
    Object.assign(booking, { detectedAddress: '', locationError: '', locationMessage: '' });
    if (!keep) Object.assign(booking, { locationCoordinates: null, locationRegion: null, locationSource: '', locationConfirmedAt: '', locationAutofill: null, locationAddressDetails: null });
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
      resetLocationConfirmation(false, false);
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
    loadPromise = Promise.all([
      fetch('/data/vietnam-administrative-latest.json', { signal: AbortSignal.timeout(10000) }),
      fetch('/data/vietnam-ward-aliases.json', { signal: AbortSignal.timeout(10000) }).then(response => response.ok ? response.json() : null).catch(() => null)
    ]).then(async ([response, legacy]) => {
      if (!response.ok) throw new Error('Directory unavailable');
      const data = await response.json();
      if (!Array.isArray(data) || data.length !== 34 || data.some(province => !Array.isArray(province.wards) || !province.wards.length)) throw new Error('Incomplete directory');
      directory = data;
      aliases = legacy?.aliases || [];
      dataStatus = 'ready';
      const booking = getBooking();
      const province = findProvince(directory, booking.city);
      const ward = findWard(province, booking.ward, aliases);
      Object.assign(booking, { city: province?.name || '', provinceCode: province?.code || null, ward: ward?.name || '', wardCode: ward?.code || null, district: '' });
      if (!province || !ward) booking.detectedAddress = '';
      save();
    }).catch(() => { dataStatus = 'error'; loadPromise = null; }).finally(() => {
      if (isLocationPage()) render();
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
        <div class="location-toolbar"><div><h2>Địa chỉ phục vụ</h2><p>Chọn địa chỉ hoặc dùng vị trí hiện tại để điền nhanh.</p></div><div class="location-gps-actions"><button type="button" class="btn location-detect-button" data-location-detect aria-controls="location-progress" aria-busy="${Boolean(booking.isDetectingLocation)}" ${booking.isDetectingLocation || dataStatus !== 'ready' ? 'disabled' : ''}><span class="location-button-spinner" data-location-spinner aria-hidden="true" ${booking.isDetectingLocation ? '' : 'hidden'}></span><span data-location-button-label>${booking.isDetectingLocation ? 'Đang lấy vị trí…' : 'Dùng vị trí hiện tại'}</span></button><button type="button" class="location-cancel" data-location-cancel hidden>Hủy định vị</button></div></div>
        <div id="location-progress" class="location-progress" data-location-progress role="status" aria-live="polite" hidden><div class="location-progress-track" aria-hidden="true"><span></span></div><strong data-location-stage>Đang xác định vị trí</strong><p data-location-stage-detail></p></div>
        <div class="location-feedback"><p data-location-status role="status" aria-live="polite" hidden></p><button type="button" class="location-cancel" data-location-manual hidden>Chỉ dùng địa chỉ nhập tay</button><a data-location-map class="location-map-link" target="_blank" rel="noopener noreferrer" hidden>Xem vị trí trên bản đồ</a><a data-location-attribution class="location-attribution" target="_blank" rel="noopener noreferrer" hidden></a></div>
        <section class="location-map-panel" data-location-map-panel aria-label="Bản đồ điểm phục vụ"><div class="location-map-heading"><div><h3>Chọn đúng điểm đến</h3><p>Dùng định vị, hoặc chọn tỉnh/xã rồi chạm vào bản đồ để đặt ghim.</p></div><button type="button" class="location-map-expand" data-map-expand aria-expanded="false">Mở rộng</button></div><div class="location-map-viewport"><div class="location-map-canvas" data-location-map-canvas></div><div class="location-map-tools"><button type="button" data-map-recenter disabled>Về điểm đã chọn</button></div><p class="location-map-loading" data-map-loading role="status">Đang tải bản đồ…</p></div><div class="location-pin-footer"><div><p class="location-coordinate-summary" data-location-coordinate-summary hidden></p><p data-location-pin-status aria-live="polite">Chưa chọn điểm. Chạm vào bản đồ hoặc dùng định vị để bắt đầu.</p></div><button type="button" class="btn" data-location-use-pin disabled>Dùng vị trí này</button></div></section>
        ${dataStatus !== 'ready' ? `<p class="location-data-status" role="status">${dataStatus === 'error' ? 'Chưa tải được danh sách địa chỉ. <button type="button" data-location-retry>Thử lại</button>' : 'Đang tải danh sách địa chỉ…'}</p>` : ''}
        <form class="ct-form location-form" data-form="location">
          <div class="location-field-row">${field('city', 'Tỉnh / Thành phố', 'Chọn tỉnh/thành phố')}${field('ward', 'Phường / Xã', 'Chọn phường/xã')}</div>
          <div class="location-field"><label for="booking-address">Số nhà, đường / thôn, xóm <span aria-hidden="true">*</span></label><input id="booking-address" type="text" name="address" value="${esc(booking.address || '')}" placeholder="Số nhà, ngõ/ngách, tên đường hoặc thôn, xóm" autocomplete="street-address" required maxlength="300"></div>
          <div class="location-field"><label for="booking-location-note">Căn hộ, tầng hoặc hướng dẫn đến nhà <span class="location-optional">(không bắt buộc)</span></label><input id="booking-location-note" type="text" name="locationNote" value="${esc(booking.locationNote || '')}" placeholder="Tên tòa nhà, số căn hộ, tầng, cổng vào…" maxlength="500"></div>
          <div class="location-address-preview" data-location-address-preview hidden><span class="location-address-caption">Địa chỉ phục vụ</span><p data-location-full-address></p><p class="location-address-hint" data-location-address-hint hidden></p></div>
          <p class="location-form-error" data-location-form-error role="alert" hidden></p>
          <dl class="location-cost"><div><dt>${esc(service.name)}</dt><dd>${service.contact ? 'Trao đổi trực tiếp' : money(service.price)}</dd></div><div><dt>Phí di chuyển</dt><dd>${money(travelFee)}</dd></div>${!service.contact ? `<div class="location-cost-total"><dt>Tổng chi phí</dt><dd>${money(service.price + travelFee)}</dd></div>` : ''}</dl>
        </form><p class="location-share-note">Địa chỉ và điểm đến bạn xác nhận sẽ được gửi cho Hoàn cùng lịch hẹn để di chuyển đến đúng nơi.</p>
      </section>`;
  }

  async function detectLocation(chosenPoint = null) {
    if (dataStatus !== 'ready' || (activeRequestId && !chosenPoint)) return;
    if (chosenPoint) cancelRequest();
    const booking = getBooking(), id = ++requestId;
    activeRequestId = id; activeBooking = booking;
    const previousPoint = booking.locationCoordinates;
    const previousAddress = { address: booking.address, provinceCode: booking.provinceCode, wardCode: booking.wardCode };
    clearAutofilledAddress(booking);
    Object.assign(booking, { locationCoordinates: null, locationConfirmedAt: '', locationRegion: null, locationSource: '' });
    if (!chosenPoint) Object.assign(booking, { locationDeviceCoordinates: null, locationCapturedAt: '' });
    controller = new AbortController();
    const signal = controller.signal;
    const stillCurrent = () => id === requestId && booking === getBooking() && isLocationPage();
    Object.assign(booking, { isDetectingLocation: true, locationStage: chosenPoint ? 'address' : 'locating', detectedAddress: '', locationError: '', locationMessage: chosenPoint ? 'Đang kiểm tra vị trí bạn chọn…' : 'Cho phép truy cập vị trí nếu trình duyệt hỏi. Bạn chỉ cần bấm một lần.' });
    save(); updateStatus();
    const finish = (error = '', message = '', stage = error ? 'failed' : 'resolved') => {
      if (!stillCurrent()) return;
      activeRequestId = 0; activeBooking = null; controller = null;
      Object.assign(booking, { isDetectingLocation: false, locationStage: stage, locationError: error, locationMessage: message });
      save(); updateStatus();
    };
    let point = chosenPoint;
    if (!point) {
      if (!navigator.geolocation) return finish('Trình duyệt chưa hỗ trợ định vị. Bạn có thể chọn địa chỉ bên dưới.');
      if (!window.isSecureContext) return finish('Để dùng định vị, hãy mở website bằng HTTPS hoặc localhost.');
      try {
        let progressKey = '';
        const position = await acquireDevicePosition(navigator.geolocation, signal, measurement => {
          if (!stillCurrent() || signal.aborted) return;
          const actual = { lat: measurement.coords.latitude, lon: measurement.coords.longitude, accuracy: measurement.coords.accuracy, mode: 'gps' };
          booking.locationDeviceCoordinates = { ...actual };
          booking.locationCapturedAt = new Date(measurement.timestamp).toISOString();
          const key = JSON.stringify(actual);
          if (key === progressKey) return;
          const first = !progressKey; progressKey = key;
          booking.locationCoordinates = actual;
          booking.locationMessage = canConfirmLocationPoint(actual) ? 'Đã nhận vị trí thiết bị. Đang kiểm tra độ chính xác…' : `Vị trí hiện còn gần đúng (±${Math.ceil(actual.accuracy)} m). Đang chờ thiết bị cải thiện độ chính xác…`;
          save(); updateStatus(first);
        }, stage => {
          if (!stillCurrent() || signal.aborted) return;
          booking.locationStage = stage;
          if (stage === 'permission') booking.locationMessage = 'Chọn “Cho phép” trong thông báo của trình duyệt để lấy vị trí. Bạn không cần bấm định vị lần nữa.';
          if (stage === 'locating') booking.locationMessage = 'Đang lấy tọa độ mới từ thiết bị. Bạn chỉ cần bấm một lần.';
          if (stage === 'retrying') booking.locationMessage = 'Vẫn đang lấy vị trí. Hệ thống đang thử lại tự động; bạn không cần bấm thêm.';
          if (stage === 'refining' && booking.locationCoordinates?.accuracy) booking.locationMessage = `Đã nhận vị trí với sai số ±${Math.ceil(booking.locationCoordinates.accuracy)} m. Đang chờ kết quả chính xác hơn…`;
          updateStatus();
        }, { permissions: navigator.permissions });
        point = { lat: Number(position.coords.latitude), lon: Number(position.coords.longitude), accuracy: Number(position.coords.accuracy) || null, mode: 'gps' };
        if (stillCurrent()) {
          booking.locationDeviceCoordinates = { ...point };
          booking.locationCapturedAt = new Date(position.timestamp).toISOString();
        }
      } catch (error) {
        if (!stillCurrent()) return;
        return finish(error.code === 1 ? 'Quyền định vị đang bị chặn. Cho phép Vị trí trong cài đặt trình duyệt rồi thử lại, hoặc chọn địa chỉ bên dưới.' : error.code === 3 ? 'Thiết bị vẫn chưa cung cấp tọa độ sau khi đã thử lại tự động. Kiểm tra quyền Vị trí trên trình duyệt và thiết bị, hoặc chọn đúng điểm đến trên bản đồ.' : 'Trình duyệt chưa cung cấp tọa độ hợp lệ. Kiểm tra quyền Vị trí trên thiết bị, hoặc chọn đúng điểm đến trên bản đồ.');
      }
    }
    if (!stillCurrent()) return;
    if (!Number.isFinite(point.lat) || !Number.isFinite(point.lon) || Math.abs(point.lat) > 90 || Math.abs(point.lon) > 180) return finish('Tọa độ GPS không hợp lệ. Vui lòng thử lại.');
    if (chosenPoint && !canConfirmLocationPoint(point)) return finish('', 'Vị trí thiết bị chưa đủ chính xác. Chạm đúng địa điểm trên bản đồ để đặt ghim, hoặc chọn địa chỉ bên dưới.');
    booking.locationCoordinates = point;
    booking.locationConfirmedAt = '';
    booking.locationRegion = null;
    booking.locationSource = '';
    booking.locationStage = 'address';
    booking.locationMessage = 'Đã nhận tọa độ. Đang đối chiếu tỉnh, phường/xã và địa chỉ…';
    updateStatus(!chosenPoint);
    let result;
    try { result = await resolveAddressAtPosition(directory, point, signal); }
    catch {
      if (stillCurrent()) finish('', 'Đã nhận tọa độ nhưng chưa đọc được địa chỉ. Bạn có thể chỉnh điểm trên bản đồ hoặc chọn địa chỉ bên dưới.', 'partial');
      return;
    }
    if (!stillCurrent()) return;
    if (result.coarse) {
      const distance = point.accuracy ? point.accuracy >= 1000 ? `${Math.round(point.accuracy / 1000)} km` : `${Math.round(point.accuracy)} m` : 'chưa rõ';
      return finish('', `Đã nhận vị trí gần đúng (sai số khoảng ${distance}), chưa đủ chính xác để tự điền địa chỉ nhà. Chạm đúng điểm đến trên bản đồ rồi bấm “Dùng vị trí này”.`, 'approximate');
    }
    if (result.area && !result.reliable) return finish('', 'Vị trí nằm gần ranh giới xã/phường. Hãy kiểm tra điểm trên bản đồ và bấm “Dùng vị trí này” để xác nhận.', 'partial');
    if (!result.area) return finish('', result.countryCode && result.countryCode !== 'vn' ? 'Vị trí hiện tại nằm ngoài Việt Nam. Chọn địa chỉ phục vụ bên dưới.' : 'Đã nhận tọa độ nhưng chưa đối chiếu được xã/phường tại điểm này. Bạn có thể chỉnh điểm trên bản đồ hoặc chọn địa chỉ bên dưới.', 'partial');
    const area = result.area;
    const keptAddress = !result.address && previousPoint && distanceMeters(previousPoint, point) <= 30 && previousAddress.provinceCode === area.provinceCode && previousAddress.wardCode === area.wardCode ? previousAddress.address : '';
    const address = result.address || keptAddress || '';
    const accepted = result.reliable && canConfirmLocationPoint(point);
    Object.assign(booking, { city: area.city, provinceCode: area.provinceCode, ward: area.ward, wardCode: area.wardCode, district: '', address, locationConfirmedAt: accepted ? new Date().toISOString() : '', locationSource: 'administrative-boundaries', locationRegion: { provinceCode: area.provinceCode, wardCode: area.wardCode } });
    booking.locationAutofill = { city: booking.city, ward: booking.ward, address: booking.address };
    booking.locationAddressDetails = result.addressDetails || null;
    booking.locationVerificationVersion = accepted ? 1 : 0;
    queries.city = null; queries.ward = null;
    for (const field of ['city', 'ward', 'address']) {
      const input = inputFor(field);
      input.value = booking[field] || '';
      if (field !== 'address') setFieldError(input);
    }
    syncWard(); closeLists();
    booking.detectedAddress = booking.address ? [booking.address, booking.ward, booking.city].join(', ') : '';
    finish('', keptAddress ? 'Đã giữ địa chỉ bạn nhập tại vị trí này. Kiểm tra lại số nhà trước khi tiếp tục.' : booking.address ? result.addressDetails?.precision === 'house' ? 'Đã có địa chỉ gợi ý gồm số nhà. Kiểm tra lại địa chỉ và bổ sung căn hộ hoặc tầng nếu có.' : 'Đã điền tên đường hoặc thôn, xóm. Bổ sung số nhà/ngõ nếu có trước khi tiếp tục.' : `Đã xác định ${area.ward}, ${area.city}. Nhập số nhà, tên đường hoặc thôn/xóm bên dưới.`);
  }

  function validate() {
    const form = root()?.querySelector('form');
    if (!form) return false;
    const error = form.querySelector('[data-location-form-error]');
    if (getBooking().isDetectingLocation) { error.hidden = false; error.textContent = 'Đang lấy và kiểm tra vị trí. Chờ hoàn tất hoặc dừng định vị để chọn địa chỉ.'; root().querySelector('[data-location-cancel]')?.focus(); return false; }
    error.hidden = dataStatus === 'ready';
    if (dataStatus !== 'ready') { error.textContent = 'Vui lòng tải lại danh sách địa chỉ trước khi tiếp tục.'; return false; }
    const cityValid = commit(inputFor('city'), true);
    const wardValid = cityValid && commit(inputFor('ward'), true);
    if (!cityValid || !wardValid) { (cityValid ? inputFor('ward') : inputFor('city')).focus(); return false; }
    const booking = getBooking();
    if (booking.locationCoordinates && (!booking.locationConfirmedAt || !canConfirmLocationPoint(booking.locationCoordinates) || !booking.locationRegion || booking.locationRegion.provinceCode !== booking.provinceCode || booking.locationRegion.wardCode !== booking.wardCode)) {
      error.hidden = false;
      error.textContent = 'Điểm trên bản đồ chưa được xác nhận đúng địa chỉ. Kiểm tra ghim và bấm “Dùng vị trí này”, hoặc chọn “Chỉ dùng địa chỉ nhập tay”.';
      const confirm = root().querySelector('[data-location-use-pin]');
      if (confirm && !confirm.disabled) confirm.focus(); else root().querySelector('[data-location-map-canvas]')?.focus();
      return false;
    }
    const address = inputFor('address');
    address.setCustomValidity(address.value.trim() ? '' : 'Nhập số nhà, tên đường hoặc thôn, xóm.');
    const valid = form.reportValidity();
    if (valid && getBooking().locationCoordinates && getBooking().locationRegion) { getBooking().locationConfirmedAt ||= new Date().toISOString(); save(); }
    return valid;
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
      if (input.name === 'address') { input.setCustomValidity(''); resetLocationConfirmation(true); }
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
    else if (event.target.closest('[data-location-manual]')) { resetLocationConfirmation(); getBooking().locationMessage = 'Địa chỉ bạn nhập sẽ được dùng làm điểm đến.'; save(); updateStatus(); }
    else if (event.target.closest('[data-location-cancel]')) { cancelRequest(); getBooking().locationMessage = ''; save(); updateStatus(); }
    else if (event.target.closest('[data-location-retry]')) { load(); render(); }
    else if (!event.target.closest('[data-location-field]')) closeLists();
  });

  return {
    html, load, validate,
    beforeRender(path) {
      if (activeRequestId && activeBooking !== getBooking()) cancelRequest();
      if (path === '/booking/location' && mapElement?.isConnected && root()?.contains(mapElement)) {
        mapFocus = mapElement.contains(document.activeElement) ? document.activeElement : null;
        // Keep the map canvas, loaded tiles, viewport and unfinished drag state.
        // It is reattached synchronously after the surrounding form is drawn.
        mapElement.remove();
      } else clearMap();
    },
    mount(path) {
      if (path !== '/booking/location') {
        clearMap();
        if (activeRequestId || getBooking().isDetectingLocation) { cancelRequest(); getBooking().locationMessage = ''; save(); }
        return;
      }
      const placeholder = root()?.querySelector('[data-location-map-panel]');
      if (mapElement && !mapElement.isConnected && placeholder) placeholder.replaceWith(mapElement);
      updateStatus(); syncWard();
      mapCleanup.resize?.();
      if (mapFocus?.isConnected) mapFocus.focus({ preventScroll: true });
      mapFocus = null;
    }
  };
}
