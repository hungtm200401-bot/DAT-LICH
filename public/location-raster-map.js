import { createLocationTiles } from './location-map-tiles.js?v=1.0';
import { canConfirmLocationPoint } from './location-utils.js?v=5.0';
import { locationPinMarkup } from './location-marker.js?v=1.0';

let library;
function loadMapLibrary() {
  if (!library) library = new Promise((resolve, reject) => {
    if (window.L) return resolve(window.L);
    if (!document.querySelector('[data-leaflet-styles]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet'; link.href = '/vendor/leaflet/leaflet.css'; link.dataset.leafletStyles = '';
      document.head.append(link);
    }
    const script = document.createElement('script'); script.src = '/vendor/leaflet/leaflet.js';
    script.onload = () => resolve(window.L); script.onerror = () => { library = null; reject(new Error('Map unavailable')); };
    document.head.append(script);
  });
  return library;
}

async function mountMap(container, point, confirm, { signal, bounds, devicePoint, readonly = false, onSelectionChange } = {}) {
  let disposed = false, map = null, observer = null, marker = null, tiles = null, element = null, resizeFrame = 0;
  const initialRole = container.getAttribute('role'), initialModal = container.getAttribute('aria-modal');
  const listeners = [];
  const listen = (node, event, callback) => { if (node) { node.addEventListener(event, callback); listeners.push(() => node.removeEventListener(event, callback)); } };
  let oldOverflow;
  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    signal?.removeEventListener('abort', cleanup);
    observer?.disconnect();
    cancelAnimationFrame(resizeFrame);
    listeners.forEach(remove => remove());
    if (container.classList.contains('is-expanded')) {
      container.classList.remove('is-expanded'); document.body.style.overflow = oldOverflow || '';
      if (initialRole) container.setAttribute('role',initialRole); else container.removeAttribute('role');
      if (initialModal) container.setAttribute('aria-modal',initialModal); else container.removeAttribute('aria-modal');
    }
    tiles?.dispose(); tiles?.off(); marker?.off();
    if (map) { map.stop(); map.remove(); map = null; }
  };
  if (signal?.aborted) return cleanup;
  signal?.addEventListener('abort', cleanup, { once: true });
  let L;
  try { L = await loadMapLibrary(); }
  catch (error) { cleanup(); throw error; }
  const canvas = container.querySelector('[data-location-map-canvas]');
  if (disposed || !container.isConnected || !canvas) { cleanup(); return cleanup; }
  // Keep zoom teardown synchronous: Leaflet 1.9.4 retains a delayed animated
  // zoom callback after remove(), including when leaving a booking mid-zoom.
  map = L.map(canvas, { scrollWheelZoom: false, maxZoom: 19, zoomAnimation: false, fadeAnimation: false, markerZoomAnimation: false, inertia: false, zoomControl: false, trackResize: false });
  if (point) map.setView([point.lat, point.lon], point.accuracy > 1000 ? 12 : 18);
  else if (bounds) map.fitBounds(bounds, { padding: [25, 25], maxZoom: 15 });
  else map.fitBounds([[8.2, 102], [23.5, 110]], { padding: [20, 20] });
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  L.control.scale({ imperial: false, position: 'bottomleft', maxWidth: 100 }).addTo(map);
  map.attributionControl.setPrefix(false);
  tiles = createLocationTiles(L);
  let gpsDot = null, circle = null, pointKey = '', gpsKey = '', boundsKey = JSON.stringify(bounds), selectionRegion = '';
  const status = container.querySelector('[data-location-pin-status]');
  const button = container.querySelector('[data-location-use-pin]');
  const coordinateLabel = container.querySelector('[data-map-coordinates]');
  const centerButton = container.querySelector('[data-map-recenter]');
  const loading = container.querySelector('[data-map-loading]');
  if (button) button.disabled = true;
  let tilesAvailable = false, failedTiles = false, candidate = null;
  const requestPending = () => container.dataset.locationBusy === 'true';
  const locationConfirmed = () => container.dataset.locationConfirmed === 'true';
  const loadedTiles = new Set();
  const tileKey = coords => `${coords.z}:${coords.x}:${coords.y}`;
  const pointTileReady = () => {
    if (!candidate) return false;
    const zoom = map.getZoom(), pixels = map.project([candidate.lat, candidate.lon], zoom);
    const size = tiles.getTileSize(), count = 2 ** zoom;
    const x = ((Math.floor(pixels.x / size.x) % count) + count) % count;
    return loadedTiles.has(`${zoom}:${x}:${Math.floor(pixels.y / size.y)}`);
  };
  const updateAvailability = () => {
    tilesAvailable = pointTileReady();
    if (button) {
      button.hidden = locationConfirmed();
      button.disabled = readonly || locationConfirmed() || requestPending() || !tilesAvailable || !canConfirmLocationPoint(candidate);
    }
    if (loading && tilesAvailable) loading.hidden = true;
  };
  const retryButton = document.createElement('button');
  retryButton.type = 'button'; retryButton.dataset.mapRetry = '';
  retryButton.className = 'location-map-retry'; retryButton.textContent = 'Thử lại bản đồ'; retryButton.hidden = true;
  let tools = container.querySelector('.location-map-tools');
  const ownTools = !tools;
  if (!tools) { tools = document.createElement('div'); tools.className = 'location-map-tools location-map-tools-inline'; canvas.after(tools); }
  tools.append(retryButton);
  listeners.push(() => { retryButton.remove(); if (ownTools) tools.remove(); });
  const setStatus = text => { if (status && status.textContent !== text) status.textContent = text; };
  const selectionMessage = () => requestPending() ? 'Đang lấy và kiểm tra vị trí. Bạn có thể chạm vào bản đồ để tự chọn điểm đến.' : locationConfirmed() ? 'Đã điền địa chỉ bên dưới. Bạn có thể tiếp tục hoặc chạm vào bản đồ để chỉnh điểm đến.' : candidate?.mode === 'gps' ? canConfirmLocationPoint(candidate) ? `Vị trí thiết bị, sai số ±${Math.ceil(candidate.accuracy)} m. Kiểm tra đúng nơi trước khi xác nhận.` : 'Vị trí thiết bị chỉ gần đúng. Chạm đúng địa điểm trên bản đồ để đặt ghim trước khi xác nhận.' : marker ? 'Điểm đã chọn. Bấm “Dùng vị trí này” để xác nhận địa chỉ phục vụ.' : 'Chạm vào bản đồ để chọn điểm đến.';
  const updateCoordinates = latlng => { if (coordinateLabel) coordinateLabel.textContent = `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`; };
  const bindMarker = latlng => {
    marker = L.marker(latlng, { draggable: !readonly, icon: L.divIcon({ className: 'location-map-marker', iconSize: [30, 38], iconAnchor: [15, 38], html: locationPinMarkup }), title: readonly ? 'Điểm phục vụ đã lưu' : 'Điểm phục vụ. Dùng phím mũi tên để điều chỉnh.' }).addTo(map);
    if (!readonly) marker.on('dragend', () => choose(marker.getLatLng()));
    element = marker.getElement();
    element.setAttribute('aria-label', readonly ? 'Điểm phục vụ đã lưu' : 'Điểm phục vụ; dùng phím mũi tên để di chuyển');
    if (!readonly) listen(element, 'keydown', event => {
      if (disposed || !container.isConnected) return;
      const directions = { ArrowLeft: [-8, 0], ArrowRight: [8, 0], ArrowUp: [0, -8], ArrowDown: [0, 8] };
      const direction = directions[event.key];
      if (!direction) return;
      event.preventDefault(); event.stopPropagation();
      const pixels = map.latLngToContainerPoint(marker.getLatLng());
      choose(map.containerPointToLatLng(pixels.add(direction)));
    });
    updateCoordinates(marker.getLatLng());
  };
  const choose = latlng => {
    if (disposed || !container.isConnected || readonly) return;
    candidate = { lat: latlng.lat, lon: latlng.lng, accuracy: null, mode: 'pin' };
    if (marker) marker.setLatLng(latlng); else bindMarker(latlng);
    updateCoordinates(latlng);
    updateAvailability();
    setStatus('Điểm đã chọn. Bấm “Dùng vị trí này” để xác nhận địa chỉ phục vụ.');
    if (centerButton) centerButton.disabled = false;
    onSelectionChange?.({ ...candidate });
  };
  cleanup.update = ({ point: nextPoint = null, devicePoint: nextDevice = null, bounds: nextBounds = null, regionKey, forceCenter = false } = {}) => {
    if (disposed || !container.isConnected) return;
    const nextPointKey = JSON.stringify(nextPoint);
    const regionChanged = regionKey !== undefined && regionKey !== selectionRegion;
    if (regionChanged) { selectionRegion = regionKey; boundsKey = ''; }
    const pointChanged = forceCenter || nextPointKey !== pointKey || (regionChanged && !nextPoint);
    if (pointChanged) {
      candidate = nextPoint ? { ...nextPoint } : null;
      if (nextPoint) {
        if (!readonly && nextPoint.mode === 'gps') { marker?.off(); marker?.remove(); marker = null; updateCoordinates(L.latLng(nextPoint.lat, nextPoint.lon)); }
        else if (marker) { marker.setLatLng([nextPoint.lat, nextPoint.lon]); updateCoordinates(marker.getLatLng()); }
        else bindMarker([nextPoint.lat, nextPoint.lon]);
      } else {
        marker?.off(); marker?.remove(); marker = null;
        setStatus('Chưa chọn điểm. Chạm vào bản đồ hoặc dùng định vị để bắt đầu.');
      }
      pointKey = nextPointKey;
    }
    const gps = nextDevice || (nextPoint?.mode !== 'pin' ? nextPoint : null);
    const nextGpsKey = JSON.stringify([gps, nextPoint?.lat, nextPoint?.lon]);
    if (nextGpsKey !== gpsKey) {
      const showDot = gps && (!readonly && nextPoint?.mode === 'gps' || !nextPoint || gps.lat !== nextPoint.lat || gps.lon !== nextPoint.lon);
      if (showDot) {
        if (gpsDot) gpsDot.setLatLng([gps.lat, gps.lon]);
        else gpsDot = L.circleMarker([gps.lat, gps.lon], { radius: 6, color: '#fff', weight: 2, fillColor: '#287bd1', fillOpacity: 1 }).bindTooltip('Vị trí GPS thiết bị').addTo(map);
      } else { gpsDot?.remove(); gpsDot = null; }
      if (gps?.accuracy) {
        if (circle) circle.setLatLng([gps.lat, gps.lon]).setRadius(gps.accuracy);
        else circle = L.circle([gps.lat, gps.lon], { radius: gps.accuracy, color: '#287bd1', weight: 1, fillOpacity: 0.08 }).addTo(map);
      } else { circle?.remove(); circle = null; }
      gpsKey = nextGpsKey;
    }
    if (pointChanged && nextPoint?.mode === 'gps') {
      if (circle && gps.accuracy > 150) map.fitBounds(circle.getBounds(), { maxZoom: 16, padding: [20, 20], animate: false });
      else map.setView([nextPoint.lat, nextPoint.lon], 18, { animate: false });
    }
    if (!nextPoint && !candidate && nextBounds && JSON.stringify(nextBounds) !== boundsKey) {
      map.fitBounds(nextBounds, { padding: [25, 25], maxZoom: 15, animate: false });
      boundsKey = JSON.stringify(nextBounds);
    }
    updateAvailability();
    if (centerButton) centerButton.disabled = !candidate;
    if (requestPending() || (candidate && tilesAvailable)) setStatus(selectionMessage());
  };
  cleanup.update({ point, devicePoint });
  tiles.on('loading', () => {
    if (disposed) return;
    failedTiles = false; retryButton.hidden = true; updateAvailability();
    if (loading && !tilesAvailable) { loading.hidden = false; loading.textContent = 'Đang tải bản đồ…'; }
  });
  tiles.on('tileload', event => {
    if (disposed) return;
    loadedTiles.add(tileKey(event.coords)); updateAvailability();
    if (loading && (tilesAvailable || !marker)) loading.hidden = true;
    if (readonly && tilesAvailable) setStatus('Điểm đến được lưu theo tọa độ khách gửi.');
    if (!failedTiles) retryButton.hidden = true;
  });
  tiles.on('tileunload', event => { loadedTiles.delete(tileKey(event.coords)); if (!disposed) updateAvailability(); });
  tiles.on('tileerror', () => { if (!disposed) { failedTiles = true; retryButton.hidden = false; } });
  tiles.on('load', () => {
    if (disposed) return;
    updateAvailability();
    const hasCurrentTiles = [...loadedTiles].some(key => key.startsWith(`${map.getZoom()}:`));
    if (marker && !map.getBounds().contains(marker.getLatLng())) {
      setStatus('Điểm đã chọn đang ở ngoài khung nhìn. Bấm “Về điểm đã chọn” để kiểm tra.');
      if (loading) loading.hidden = true;
    } else if (!hasCurrentTiles || (marker && !tilesAvailable)) {
      setStatus('Chưa tải được nền bản đồ. Kiểm tra kết nối hoặc nhập địa chỉ bên dưới.');
      if (loading) { loading.hidden = false; loading.textContent = 'Chưa tải được bản đồ tại điểm đã chọn. Bạn có thể thử lại.'; }
    } else if (!readonly) {
      setStatus(selectionMessage());
    }
    retryButton.hidden = !failedTiles;
  });
  const retry = () => {
    if (disposed || !container.isConnected || !failedTiles) return;
    const restoreFocus = document.activeElement === retryButton;
    tiles.retry();
    if (restoreFocus) canvas.focus({ preventScroll: true });
  };
  listen(retryButton, 'click', retry);
  listen(window, 'online', retry);
  map.on('zoomend moveend', updateAvailability);
  tiles.addTo(map);
  if (!readonly) map.on('click', event => choose(event.latlng));
  listen(canvas, 'keydown', event => {
    if (readonly || event.key !== 'Enter' || event.target !== canvas) return;
    event.preventDefault(); choose(map.getCenter());
  });
  listen(button, 'click', () => {
    if (disposed || !container.isConnected || readonly || requestPending() || !candidate || !tilesAvailable || button.disabled || !canConfirmLocationPoint(candidate)) return;
    confirm({ ...candidate });
  });
  listen(centerButton, 'click', () => { if (candidate) map.setView([candidate.lat, candidate.lon], 18, { animate: false }); });
  const expandButton = container.querySelector('[data-map-expand]');
  const expand = expanded => {
    if (expanded) oldOverflow = document.body.style.overflow;
    container.classList.toggle('is-expanded', expanded);
    if (expanded) { container.setAttribute('role','dialog'); container.setAttribute('aria-modal','true'); }
    else { if (initialRole) container.setAttribute('role',initialRole); else container.removeAttribute('role'); container.removeAttribute('aria-modal'); }
    document.body.style.overflow = expanded ? 'hidden' : oldOverflow || '';
    if (expandButton) { expandButton.textContent = expanded ? 'Thu nhỏ' : 'Mở rộng'; expandButton.setAttribute('aria-expanded', String(expanded)); }
    resize();
  };
  listen(expandButton, 'click', () => expand(!container.classList.contains('is-expanded')));
  listen(document, 'keydown', event => {
    if (!container.classList.contains('is-expanded')) return;
    if (event.key === 'Escape') { expand(false); expandButton?.focus(); event.stopPropagation(); }
    if (event.key === 'Tab') {
      const controls = [...container.querySelectorAll('a[href],button:not(:disabled),[tabindex="0"]')].filter(node => node.getClientRects().length);
      const next = event.shiftKey ? controls.at(-1) : controls[0];
      if (next && (document.activeElement === (event.shiftKey ? controls[0] : controls.at(-1)) || !container.contains(document.activeElement))) { event.preventDefault(); next.focus(); }
    }
  });
  let width = canvas.clientWidth, height = canvas.clientHeight;
  const resize = () => {
    if (disposed || resizeFrame) return;
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      if (disposed || !container.isConnected) return;
      const nextWidth = canvas.clientWidth, nextHeight = canvas.clientHeight;
      if (!nextWidth || !nextHeight || (nextWidth === width && nextHeight === height)) return;
      width = nextWidth; height = nextHeight;
      map.invalidateSize({ animate: false, pan: true, debounceMoveend: true });
    });
  };
  cleanup.resize = resize;
  observer = new ResizeObserver(resize); observer.observe(canvas);
  return cleanup;
}

export function mountLocationMap(container, point, confirm, options = {}) { return mountMap(container, point, confirm, options); }
export function mountReadonlyLocationMap(container, point, options = {}) { return mountMap(container, point, null, { ...options, readonly: true }); }
