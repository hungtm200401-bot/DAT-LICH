import { canConfirmLocationPoint } from './location-utils.js?v=5.0';
import { locationPinMarkup } from './location-marker.js?v=1.0';

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const BASE_SOURCE = 'openmaptiles';
const GPS_SOURCE = 'location-device-position';
const LOAD_TIMEOUT = 12000;
let library;

function loadMapLibrary() {
  if (!document.querySelector('[data-maplibre-styles]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = '/vendor/maplibre/maplibre-gl.css?v=6.16.0';
    link.dataset.maplibreStyles = '';
    document.head.append(link);
  }
  if (window.maplibregl) return Promise.resolve(window.maplibregl);
  if (library) return library;
  library = (async () => {
    let timeout;
    try {
      const gl = await Promise.race([
        import('/vendor/maplibre/maplibre-gl.mjs?v=6.16.0'),
        new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('Map library unavailable')), LOAD_TIMEOUT); }),
      ]);
      gl.setWorkerUrl('/vendor/maplibre/maplibre-gl-worker.mjs?v=6.16.0');
      gl.setWorkerCount(1);
      window.maplibregl = gl;
      return gl;
    } catch (error) { library = null; throw error; }
    finally { clearTimeout(timeout); }
  })();
  return library;
}

function validPoint(point) {
  return point && Number.isFinite(point.lat) && Number.isFinite(point.lon) && Math.abs(point.lat) <= 85.051129 && Math.abs(point.lon) <= 180;
}

function vectorBounds(bounds) {
  if (!Array.isArray(bounds) || bounds.length !== 2 || !bounds.every(pair => Array.isArray(pair) && pair.length === 2 && pair.every(Number.isFinite))) return null;
  return bounds.map(([lat, lon]) => [lon, lat]);
}

function accuracyRing(point) {
  const radius = Number(point.accuracy);
  if (!(radius > 0 && Number.isFinite(radius))) return null;
  const angular = radius / 6371008.8, lat = point.lat * Math.PI / 180, lon = point.lon * Math.PI / 180;
  return Array.from({ length: 65 }, (_, index) => {
    const bearing = (index % 64) * Math.PI / 32;
    const ringLat = Math.asin(Math.sin(lat) * Math.cos(angular) + Math.cos(lat) * Math.sin(angular) * Math.cos(bearing));
    const ringLon = lon + Math.atan2(Math.sin(bearing) * Math.sin(angular) * Math.cos(lat), Math.cos(angular) - Math.sin(lat) * Math.sin(ringLat));
    return [ringLon * 180 / Math.PI, ringLat * 180 / Math.PI];
  });
}

function gpuUnavailable(cause) {
  const error = new Error('Trình duyệt chưa hỗ trợ bản đồ WebGL.', { cause });
  error.code = 'MAP_WEBGL_UNAVAILABLE';
  return error;
}

export async function mountVectorLocationMap(container, point, confirm, { signal, bounds, devicePoint, readonly = false, onSelectionChange } = {}) {
  let disposed = false, map = null, marker = null, observer = null, resizeFrame = 0, loadTimer = 0;
  let markerCleanup = () => {}, oldOverflow = '', expandedHere = false;
  const initialRole = container.getAttribute('role'), initialModal = container.getAttribute('aria-modal');
  const listeners = [];
  const listen = (node, event, callback) => {
    if (!node) return;
    node.addEventListener(event, callback);
    listeners.push(() => node.removeEventListener(event, callback));
  };
  const restoreDialog = () => {
    if (initialRole === null) container.removeAttribute('role'); else container.setAttribute('role', initialRole);
    if (initialModal === null) container.removeAttribute('aria-modal'); else container.setAttribute('aria-modal', initialModal);
  };
  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    signal?.removeEventListener('abort', cleanup);
    clearTimeout(loadTimer);
    cancelAnimationFrame(resizeFrame);
    observer?.disconnect();
    listeners.splice(0).forEach(remove => remove());
    markerCleanup(); marker?.remove(); marker = null;
    if (expandedHere) {
      container.classList.remove('is-expanded'); document.body.style.overflow = oldOverflow;
      restoreDialog();
    }
    if (map) { map.stop(); map.remove(); map = null; }
  };
  cleanup.update = () => {};
  cleanup.resize = () => {};
  if (signal?.aborted) return cleanup;
  signal?.addEventListener('abort', cleanup, { once: true });
  let gl;
  try { gl = await loadMapLibrary(); }
  catch (error) { cleanup(); throw error; }
  const canvas = container.querySelector('[data-location-map-canvas]');
  if (disposed || !container.isConnected || !canvas) { cleanup(); return cleanup; }
  if (typeof gl.supported === 'function' && !gl.supported({ failIfMajorPerformanceCaveat: false })) { cleanup(); throw gpuUnavailable(); }

  const status = container.querySelector('[data-location-pin-status]');
  const button = container.querySelector('[data-location-use-pin]');
  const coordinateLabel = container.querySelector('[data-map-coordinates]');
  const centerButton = container.querySelector('[data-map-recenter]');
  const loading = container.querySelector('[data-map-loading]');
  const retryButton = document.createElement('button');
  retryButton.type = 'button'; retryButton.dataset.mapRetry = '';
  retryButton.className = 'location-map-retry'; retryButton.textContent = 'Thử lại bản đồ'; retryButton.hidden = true;
  let tools = container.querySelector('.location-map-tools');
  const ownTools = !tools;
  if (!tools) { tools = document.createElement('div'); tools.className = 'location-map-tools location-map-tools-inline'; canvas.after(tools); }
  tools.append(retryButton);
  listeners.push(() => { retryButton.remove(); if (ownTools) tools.remove(); });
  if (button) button.disabled = true;
  const initialTabIndex = canvas.getAttribute('tabindex');
  canvas.tabIndex = 0;
  listeners.push(() => { if (initialTabIndex === null) canvas.removeAttribute('tabindex'); else canvas.setAttribute('tabindex', initialTabIndex); });

  let selected = null, currentGPS = null, pointKey = '', gpsKey = '', boundsKey = JSON.stringify(bounds), selectionRegion = '';
  let styleReady = false, failed = false, failureCause = '', retrying = false, automaticRetries = 0;
  const loadedTiles = new Set();
  const tileKey = tile => `${tile.z}:${tile.x}:${tile.y}`;
  const setStatus = message => { if (status && status.textContent !== message) status.textContent = message; };
  const requestPending = () => container.dataset.locationBusy === 'true';
  const locationConfirmed = () => container.dataset.locationConfirmed === 'true';
  const tileAt = (location, zoom) => {
    const count = 2 ** zoom;
    const x = ((Math.floor((location.lon + 180) / 360 * count) % count) + count) % count;
    const latitude = location.lat * Math.PI / 180;
    const y = Math.min(count - 1, Math.max(0, Math.floor((1 - Math.log(Math.tan(latitude) + 1 / Math.cos(latitude)) / Math.PI) / 2 * count)));
    return `${zoom}:${x}:${y}`;
  };
  const baseReady = () => styleReady && !failed && Boolean(map.getSource(BASE_SOURCE)) && map.isSourceLoaded(BASE_SOURCE) && map.areTilesLoaded();
  const loadedCoverage = location => {
    for (const key of loadedTiles) {
      const zoom = Number(key.slice(0, key.indexOf(':')));
      if (tileAt(location, zoom) === key) return true;
    }
    return false;
  };
  const pointTileReady = () => {
    if (!selected || !baseReady() || !map.getBounds().contains([selected.lon, selected.lat])) return false;
    return loadedCoverage(selected);
  };
  const viewportReady = () => {
    if (!baseReady()) return false;
    const center = map.getCenter();
    return loadedCoverage({ lat: center.lat, lon: center.lng });
  };
  const visibleMapReady = () => selected && map.getBounds().contains([selected.lon, selected.lat]) ? pointTileReady() : viewportReady();
  const updateAvailability = () => {
    if (disposed || !map) return;
    const ready = pointTileReady(), viewReady = visibleMapReady();
    if (button) {
      button.hidden = locationConfirmed();
      button.disabled = readonly || locationConfirmed() || requestPending() || !ready || !canConfirmLocationPoint(selected);
    }
    if (centerButton) centerButton.disabled = !selected;
    if (viewReady) {
      clearTimeout(loadTimer); loadTimer = 0; retrying = false;
      if (loading) loading.hidden = true;
      retryButton.hidden = !failed;
    }
    return ready;
  };
  const showFailure = (cause = 'error') => {
    if (disposed) return;
    failed = true; failureCause = cause; retrying = false;
    clearTimeout(loadTimer); loadTimer = 0;
    retryButton.hidden = false;
    if (loading) { loading.hidden = false; loading.textContent = 'Chưa tải được bản đồ. Kiểm tra kết nối rồi bấm “Thử lại bản đồ”.'; }
    setStatus('Chưa tải được nền bản đồ để kiểm tra điểm đến. Bạn có thể thử lại hoặc chọn địa chỉ bên dưới.');
    updateAvailability();
  };
  const beginLoading = () => {
    if (disposed || loadTimer || failed || visibleMapReady()) return;
    if (loading) { loading.hidden = false; loading.textContent = 'Đang tải bản đồ…'; }
    loadTimer = setTimeout(() => showFailure('timeout'), LOAD_TIMEOUT);
  };
  const updateStatus = () => {
    if (disposed || failed) return;
    const ready = updateAvailability();
    if (requestPending()) { setStatus('Đang lấy và kiểm tra vị trí. Bạn có thể chạm vào bản đồ để tự chọn điểm đến.'); return; }
    if (selected && !map.getBounds().contains([selected.lon, selected.lat])) {
      setStatus('Điểm đã chọn đang ở ngoài khung nhìn. Bấm “Về điểm đã chọn” để kiểm tra.');
      if (loading) loading.hidden = true;
    } else if (selected && ready) setStatus(readonly ? 'Điểm đến được lưu theo tọa độ khách gửi.' : locationConfirmed() ? 'Đã điền địa chỉ bên dưới. Bạn có thể tiếp tục hoặc chạm vào bản đồ để chỉnh điểm đến.' : selected.mode === 'gps' ? canConfirmLocationPoint(selected) ? `Vị trí thiết bị, sai số ±${Math.ceil(selected.accuracy)} m. Kiểm tra đúng nơi trước khi xác nhận, hoặc chạm vào bản đồ để chỉnh.` : 'Vị trí thiết bị chỉ gần đúng. Chạm đúng địa điểm trên bản đồ để đặt ghim trước khi xác nhận.' : 'Điểm đã chọn. Bấm “Dùng vị trí này” để xác nhận địa chỉ phục vụ.');
    else if (selected) { setStatus('Đang tải nền bản đồ tại điểm đã chọn…'); beginLoading(); }
    else if (viewportReady()) setStatus('Chạm vào bản đồ để chọn điểm đến.');
  };

  try {
    map = new gl.Map({
      container: canvas, style: STYLE_URL,
      center: validPoint(point) ? [point.lon, point.lat] : [106, 16], zoom: validPoint(point) ? 18 : 4,
      maxZoom: 19, minZoom: 2, scrollZoom: false, dragRotate: false, pitchWithRotate: false,
      touchPitch: false, maxPitch: 0, renderWorldCopies: false, fadeDuration: 0,
      trackResize: false, attributionControl: false, refreshExpiredTiles: true,
      failIfMajorPerformanceCaveat: false,
      locale: { 'NavigationControl.ZoomIn': 'Phóng to', 'NavigationControl.ZoomOut': 'Thu nhỏ', 'AttributionControl.ToggleAttribution': 'Thông tin nguồn bản đồ', 'Map.Title': 'Bản đồ điểm phục vụ' },
    });
  } catch (error) {
    cleanup();
    if (/webgl|graphics|context/i.test(error?.message || '')) {
      canvas.replaceChildren(); canvas.classList.remove('maplibregl-map');
      throw gpuUnavailable(error);
    }
    throw error;
  }
  map.touchZoomRotate.disableRotation();
  map.keyboard.disableRotation();
  map.addControl(new gl.NavigationControl({ showCompass: false, visualizePitch: false }), 'bottom-right');
  map.addControl(new gl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left');
  map.addControl(new gl.AttributionControl({ compact: false }), 'bottom-right');
  const on = (event, handler) => {
    map.on(event, handler);
    listeners.push(() => map?.off(event, handler));
  };
  const syncGPS = () => {
    if (!styleReady || disposed) return;
    const features = [];
    if (validPoint(currentGPS)) {
      const ring = accuracyRing(currentGPS);
      if (ring) features.push({ type: 'Feature', properties: { kind: 'accuracy' }, geometry: { type: 'Polygon', coordinates: [ring] } });
      features.push({ type: 'Feature', properties: { kind: 'device' }, geometry: { type: 'Point', coordinates: [currentGPS.lon, currentGPS.lat] } });
    }
    const data = { type: 'FeatureCollection', features };
    const source = map.getSource(GPS_SOURCE);
    if (source) source.setData(data);
    else {
      map.addSource(GPS_SOURCE, { type: 'geojson', data });
      map.addLayer({ id: `${GPS_SOURCE}-fill`, type: 'fill', source: GPS_SOURCE, filter: ['==', 'kind', 'accuracy'], paint: { 'fill-color': '#287bd1', 'fill-opacity': 0.08 } });
      map.addLayer({ id: `${GPS_SOURCE}-line`, type: 'line', source: GPS_SOURCE, filter: ['==', 'kind', 'accuracy'], paint: { 'line-color': '#287bd1', 'line-width': 1 } });
      map.addLayer({ id: `${GPS_SOURCE}-dot`, type: 'circle', source: GPS_SOURCE, filter: ['==', 'kind', 'device'], paint: { 'circle-color': '#287bd1', 'circle-radius': 6, 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 } });
    }
  };
  const updateCoordinates = () => { if (coordinateLabel && selected) coordinateLabel.textContent = `${selected.lat.toFixed(6)}, ${selected.lon.toFixed(6)}`; };
  const removeMarker = () => { markerCleanup(); markerCleanup = () => {}; marker?.remove(); marker = null; selected = null; };
  const setMarker = location => {
    selected = { lat: location.lat, lon: location.lon, accuracy: Number.isFinite(location.accuracy) ? location.accuracy : null, mode: location.mode === 'gps' ? 'gps' : 'pin' };
    if (!readonly && selected.mode === 'gps') {
      markerCleanup(); markerCleanup = () => {}; marker?.remove(); marker = null;
      updateCoordinates();
      return;
    }
    if (marker) marker.setLngLat([selected.lon, selected.lat]);
    else {
      const element = document.createElement('div');
      element.className = 'location-map-marker'; element.innerHTML = locationPinMarkup;
      element.style.width = '30px'; element.style.height = '38px';
      element.tabIndex = readonly ? -1 : 0;
      element.setAttribute('role', 'img');
      element.setAttribute('aria-label', readonly ? 'Điểm phục vụ đã lưu' : 'Điểm phục vụ; dùng phím mũi tên để di chuyển');
      element.title = readonly ? 'Điểm phục vụ đã lưu' : 'Điểm phục vụ. Dùng phím mũi tên để điều chỉnh.';
      marker = new gl.Marker({ element, draggable: !readonly, anchor: 'bottom' }).setLngLat([selected.lon, selected.lat]).addTo(map);
      const dragstart = () => { if (button) button.disabled = true; };
      const dragend = () => { const position = marker.getLngLat(); choose({ lat: position.lat, lon: position.lng }); };
      const keydown = event => {
        if (disposed || !container.isConnected || readonly) return;
        const direction = { ArrowLeft: [-8, 0], ArrowRight: [8, 0], ArrowUp: [0, -8], ArrowDown: [0, 8] }[event.key];
        if (!direction) return;
        event.preventDefault(); event.stopPropagation();
        const position = map.project([selected.lon, selected.lat]);
        const next = map.unproject([position.x + direction[0], position.y + direction[1]]).wrap();
        choose({ lat: next.lat, lon: next.lng });
      };
      if (!readonly) { marker.on('dragstart', dragstart); marker.on('dragend', dragend); element.addEventListener('keydown', keydown); }
      markerCleanup = () => { marker?.off('dragstart', dragstart); marker?.off('dragend', dragend); element.removeEventListener('keydown', keydown); };
    }
    updateCoordinates();
  };
  const choose = location => {
    if (disposed || !container.isConnected || readonly || !validPoint(location)) return;
    setMarker({ ...location, accuracy: null, mode: 'pin' }); updateStatus();
    onSelectionChange?.({ ...selected });
  };
  const centerAt = location => {
    const ring = location.mode !== 'pin' && accuracyRing(location);
    if (ring && location.accuracy > 150) {
      const longitudes = ring.map(pair => pair[0]), latitudes = ring.map(pair => pair[1]);
      map.fitBounds([[Math.min(...longitudes), Math.min(...latitudes)], [Math.max(...longitudes), Math.max(...latitudes)]], { padding: 25, maxZoom: 16, duration: 0 });
    } else map.jumpTo({ center: [location.lon, location.lat], zoom: 18 });
  };
  cleanup.update = ({ point: nextPoint = null, devicePoint: nextDevice = null, bounds: nextBounds = null, regionKey, forceCenter = false } = {}) => {
    if (disposed || !container.isConnected) return;
    const nextPointKey = JSON.stringify(nextPoint);
    const regionChanged = regionKey !== undefined && regionKey !== selectionRegion;
    if (regionChanged) { selectionRegion = regionKey; boundsKey = ''; }
    const changed = forceCenter || nextPointKey !== pointKey || (regionChanged && !nextPoint);
    if (changed) {
      if (validPoint(nextPoint)) setMarker(nextPoint);
      else { removeMarker(); if (coordinateLabel) coordinateLabel.textContent = ''; setStatus('Chưa chọn điểm. Chạm vào bản đồ hoặc dùng định vị để bắt đầu.'); }
      pointKey = nextPointKey;
    }
    const gps = validPoint(nextDevice) ? nextDevice : nextPoint?.mode !== 'pin' && validPoint(nextPoint) ? nextPoint : null;
    const nextGpsKey = JSON.stringify(gps);
    if (nextGpsKey !== gpsKey) { currentGPS = gps; gpsKey = nextGpsKey; syncGPS(); }
    if (changed && validPoint(nextPoint) && (nextPoint.mode === 'gps' || forceCenter)) centerAt(nextPoint);
    const nextBoundsKey = JSON.stringify(nextBounds), convertedBounds = vectorBounds(nextBounds);
    if (!nextPoint && !selected && convertedBounds && nextBoundsKey !== boundsKey) {
      map.fitBounds(convertedBounds, { padding: 25, maxZoom: 15, duration: 0 }); boundsKey = nextBoundsKey;
    }
    updateAvailability(); updateStatus();
  };
  on('style.load', () => { if (!disposed) { styleReady = true; syncGPS(); updateAvailability(); } });
  on('sourcedata', event => {
    if (disposed || event.sourceId !== BASE_SOURCE || !event.coord?.canonical) return;
    // MapLibre 6 emits successful tile events without sourceDataType. Older
    // versions label them "content"; metadata/visibility events are not tiles.
    if (event.sourceDataType !== undefined && event.sourceDataType !== 'content') return;
    if (event.tile?.state !== undefined && event.tile.state !== 'loaded') return;
    const key = tileKey(event.coord.canonical);
    loadedTiles.delete(key); loadedTiles.add(key);
    if (loadedTiles.size > 256) loadedTiles.delete(loadedTiles.values().next().value);
    // A slow request can finish after the wait notice appears. Actual tile
    // content may recover a timeout; a network/style error still needs retry.
    if (failureCause === 'timeout') { failed = false; failureCause = ''; }
    updateStatus();
  });
  on('sourcedataloading', event => {
    if (event.sourceId !== BASE_SOURCE) return;
    if (event.coord?.canonical) loadedTiles.delete(tileKey(event.coord.canonical));
    updateAvailability(); beginLoading();
  });
  on('error', () => showFailure());
  on('idle', updateStatus);
  on('movestart', () => { if (!disposed && button) button.disabled = true; });
  on('moveend', updateStatus);
  if (!readonly) on('click', event => { const position = event.lngLat.wrap(); choose({ lat: position.lat, lon: position.lng }); });
  listen(canvas, 'keydown', event => {
    if (readonly || event.key !== 'Enter' || (event.target !== canvas && event.target !== map.getCanvas())) return;
    event.preventDefault();
    const center = map.getCenter(); choose({ lat: center.lat, lon: center.lng });
  });
  const retry = (automatic = false) => {
    if (disposed || !container.isConnected || !failed || retrying || (automatic && automaticRetries >= 2)) return;
    if (automatic) automaticRetries++; else automaticRetries = 0;
    const restoreFocus = document.activeElement === retryButton;
    failed = false; failureCause = ''; retrying = true; styleReady = false; loadedTiles.clear();
    retryButton.hidden = true;
    if (button) button.disabled = true;
    setStatus('Đang tải lại bản đồ…');
    beginLoading();
    try { map.stop(); map.setStyle(STYLE_URL, { diff: false }); }
    catch { showFailure(); }
    if (restoreFocus) map.getCanvas().focus({ preventScroll: true });
  };
  listen(retryButton, 'click', () => retry());
  listen(window, 'online', () => retry(true));
  listen(button, 'click', () => {
    if (disposed || !container.isConnected || readonly || requestPending() || !selected || button.disabled || !pointTileReady() || !canConfirmLocationPoint(selected)) return;
    confirm?.({ ...selected });
  });
  listen(centerButton, 'click', () => { if (!disposed && selected) { map.stop(); map.jumpTo({ center: [selected.lon, selected.lat], zoom: 18 }); updateStatus(); } });

  let width = canvas.clientWidth, height = canvas.clientHeight;
  const resize = () => {
    if (disposed || resizeFrame) return;
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      if (disposed || !container.isConnected) return;
      const nextWidth = canvas.clientWidth, nextHeight = canvas.clientHeight;
      if (!nextWidth || !nextHeight || (nextWidth === width && nextHeight === height)) return;
      width = nextWidth; height = nextHeight; map.resize(); updateStatus();
    });
  };
  cleanup.resize = resize;
  observer = new ResizeObserver(resize); observer.observe(canvas);
  const expandButton = container.querySelector('[data-map-expand]');
  const expand = expanded => {
    if (expanded === expandedHere) return;
    if (expanded) { oldOverflow = document.body.style.overflow; container.setAttribute('role', 'dialog'); container.setAttribute('aria-modal', 'true'); }
    else restoreDialog();
    expandedHere = expanded; container.classList.toggle('is-expanded', expanded);
    document.body.style.overflow = expanded ? 'hidden' : oldOverflow;
    if (expandButton) { expandButton.textContent = expanded ? 'Thu nhỏ' : 'Mở rộng'; expandButton.setAttribute('aria-expanded', String(expanded)); }
    resize();
  };
  listen(expandButton, 'click', () => expand(!expandedHere));
  listen(document, 'keydown', event => {
    if (!expandedHere || disposed) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); expand(false); expandButton?.focus(); }
    if (event.key === 'Tab') {
      const controls = [...container.querySelectorAll('a[href],button:not(:disabled),[tabindex="0"]')].filter(node => !node.hidden && node.getClientRects().length);
      const next = event.shiftKey ? controls.at(-1) : controls[0];
      if (next && (document.activeElement === (event.shiftKey ? controls[0] : controls.at(-1)) || !container.contains(document.activeElement))) { event.preventDefault(); next.focus(); }
    }
  });
  if (validPoint(point)) centerAt(point);
  else map.fitBounds(vectorBounds(bounds) || [[102, 8.2], [110, 23.5]], { padding: 20, duration: 0 });
  cleanup.update({ point, devicePoint });
  beginLoading();
  return cleanup;
}
