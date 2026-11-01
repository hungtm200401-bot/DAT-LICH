import { locateAdministrativeArea } from './location-boundaries.js?v=3.0';
import { normalizeReverseAddress, parseBigDataCloudAddress, formatAddressDetails } from './location-utils.js?v=5.0';

const positionAbort = () => new DOMException('Cancelled', 'AbortError');
const positionError = (code, message) => Object.assign(new Error(message), { code });
const isCurrentPosition = position => {
  const coordinates = position?.coords;
  if (!coordinates || !Number.isFinite(coordinates.latitude) || Math.abs(coordinates.latitude) > 90 || !Number.isFinite(coordinates.longitude) || Math.abs(coordinates.longitude) > 180 || !Number.isFinite(coordinates.accuracy) || coordinates.accuracy <= 0) return false;
  // A timestamp is required to distinguish a current measurement from a cache.
  return Number.isFinite(position.timestamp) && position.timestamp > 0 && Date.now() - position.timestamp <= 30000 && position.timestamp <= Date.now() + 1000;
};
const positionDistance = (first, second) => {
  const radians = Math.PI / 180;
  const latitude = (second.coords.latitude - first.coords.latitude) * radians;
  const longitude = (second.coords.longitude - first.coords.longitude) * radians;
  const haversine = Math.sin(latitude / 2) ** 2 + Math.cos(first.coords.latitude * radians) * Math.cos(second.coords.latitude * radians) * Math.sin(longitude / 2) ** 2;
  return 12742000 * Math.asin(Math.sqrt(Math.min(1, haversine)));
};

export async function acquireDevicePosition(geolocation, signal, onProgress, onStage, { permissions } = {}) {
  if (signal.aborted) throw positionAbort();
  let stage;
  const reportStage = next => {
    if (stage === next || signal.aborted) return;
    stage = next;
    if (typeof onStage === 'function') onStage(next);
  };
  reportStage('locating');
  if (signal.aborted) throw positionAbort();
  let acceptLateInitial, queuedLateInitial, acceptingInitial = true;
  try {
    const request = () => new Promise((resolve, reject) => {
      let finished = false, timer, permissionStatus, permissionChanged;
      let timedOut = false;
      const finish = (callback, value) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        permissionStatus?.removeEventListener?.('change', permissionChanged);
        signal.removeEventListener('abort', abort);
        callback(value);
      };
      const abort = () => finish(reject, positionAbort());
      signal.addEventListener('abort', abort, { once: true });
      const startDeadline = () => {
        if (finished) return;
        clearTimeout(timer);
        timer = setTimeout(() => {
          timedOut = true;
          finish(reject, positionError(3, 'Device position timed out.'));
        }, 12000);
      };
      startDeadline();
      // Browser acquisition timeouts exclude the permission prompt. Match that
      // behavior when permission state is available, while keeping a watchdog
      // for unsupported/broken Permissions APIs. The native result is authority.
      if (typeof permissions?.query === 'function') {
        try {
          Promise.resolve(permissions.query({ name: 'geolocation' })).then(status => {
            if (finished || signal.aborted || !status) return;
            permissionStatus = status;
            permissionChanged = () => {
              if (finished || signal.aborted) return;
              if (permissionStatus.state === 'prompt' && typeof permissionStatus.addEventListener === 'function') {
                clearTimeout(timer);
                reportStage('permission');
              } else {
                reportStage('locating');
                startDeadline();
              }
            };
            permissionStatus.addEventListener?.('change', permissionChanged);
            permissionChanged();
          }).catch(() => { /* Keep the native request and bounded watchdog. */ });
        } catch { /* Permissions is optional; native geolocation still works. */ }
      }
      try {
        geolocation.getCurrentPosition(position => {
          if (!finished) finish(resolve, position);
          else if (timedOut && acceptingInitial && !signal.aborted) {
            // The native cold-start request can outlive our first watchdog.
            // Keep its current result eligible during this same recovery only.
            if (acceptLateInitial) acceptLateInitial(position);
            else queuedLateInitial = position;
          }
        }, error => finish(reject, error), { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
      } catch (error) { finish(reject, error); }
    });
    let best, lastError;
    try {
      const position = await request();
      if (isCurrentPosition(position)) best = position;
      else lastError = positionError(2, 'The device returned an invalid or outdated position.');
    } catch (error) {
      if (signal.aborted) throw positionAbort();
      if (error.code === 1) throw error;
      lastError = error;
    }
    if (signal.aborted) throw positionAbort();
    if (best && typeof onProgress === 'function') onProgress(best);
    if (signal.aborted) throw positionAbort();
    if (best?.coords.accuracy <= 30) return best;
    const retry = !best;
    const canWatch = typeof geolocation.watchPosition === 'function';
    if (!retry && !canWatch) return best;
    return await new Promise((resolve, reject) => {
      let watchId, assigned = false, cleared = false, timer, retryTimer, finished = false, pending;
      let retryFinished = !retry, watching = canWatch;
      let latestTimestamp = best?.timestamp;
      const clearWatch = () => {
        if (!assigned || cleared || watchId == null) return;
        cleared = true;
        geolocation.clearWatch?.(watchId);
      };
      const finish = error => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        clearTimeout(retryTimer);
        signal.removeEventListener('abort', abort);
        clearWatch();
        if (signal.aborted) reject(positionAbort());
        else if (error) reject(error);
        else if (isCurrentPosition(best)) resolve(best);
        else reject(lastError || positionError(3, 'No current device position was received.'));
      };
      const abort = () => finish(positionAbort());
      signal.addEventListener('abort', abort, { once: true });
      const select = position => {
        if (finished) return;
        if (signal.aborted) { abort(); return; }
        if (!isCurrentPosition(position)) return false;
        if (Number.isFinite(position.timestamp)) {
          if (Number.isFinite(latestTimestamp) && position.timestamp < latestTimestamp) return false;
          latestTimestamp = position.timestamp;
        }
        if (!isCurrentPosition(best)) best = undefined;
        if (best && position.coords.accuracy > best.coords.accuracy) return false;
        if (best && position.coords.accuracy === best.coords.accuracy && !(Number.isFinite(position.timestamp) && (!Number.isFinite(best.timestamp) || position.timestamp > best.timestamp))) return false;
        const distant = best && best.coords.accuracy <= 150 && positionDistance(best, position) > best.coords.accuracy + position.coords.accuracy + 30;
        if (distant) {
          // A single precise-looking jump needs another compatible measurement.
          const repeated = pending && position.timestamp > pending.timestamp && positionDistance(pending, position) <= Math.max(50, pending.coords.accuracy + position.coords.accuracy);
          if (!repeated) { pending = position; return false; }
          if (pending.coords.accuracy < position.coords.accuracy) position = pending;
        }
        best = position;
        pending = undefined;
        if (typeof onProgress === 'function') onProgress(best);
        if (signal.aborted) { abort(); return; }
        if (best.coords.accuracy <= 30) finish();
        else if (watching) reportStage('refining');
        return true;
      };
      acceptLateInitial = select;
      // A GPS receiver may need more than a few seconds to replace a network fix.
      // Retry the browser's other location mode concurrently so the whole attempt
      // stays within 30 seconds, even when both device providers stop responding.
      // Keep original samples and accuracy estimates; never average a location.
      timer = setTimeout(() => finish(), 18000);
      if (queuedLateInitial) {
        select(queuedLateInitial);
        queuedLateInitial = null;
        if (finished) return;
      }
      if (retry) {
        reportStage('retrying');
        if (signal.aborted) { abort(); return; }
        const retryFailed = error => {
          if (finished || retryFinished) return;
          retryFinished = true;
          clearTimeout(retryTimer);
          lastError = error;
          if (error.code === 1 || !watching) finish(error);
        };
        retryTimer = setTimeout(() => retryFailed(positionError(3, 'Device position retry timed out.')), 6000);
        try {
          geolocation.getCurrentPosition(position => {
            if (finished || retryFinished) return;
            retryFinished = true;
            clearTimeout(retryTimer);
            if (!isCurrentPosition(position)) {
              lastError = positionError(2, 'The device returned an invalid or outdated position.');
            } else select(position);
            if (!watching && !finished) finish();
          }, retryFailed, { enableHighAccuracy: false, timeout: 6000, maximumAge: 0 });
        } catch (error) { retryFailed(error); }
      } else reportStage('refining');
      if (finished || !canWatch) return;
      try {
        watchId = geolocation.watchPosition(select, error => {
          if (finished) return;
          if (error.code === 1) finish(error);
          else lastError = error;
        }, { enableHighAccuracy: true, maximumAge: 0, timeout: 18000 });
        assigned = true;
        if (finished) clearWatch();
      } catch (error) {
        watching = false;
        lastError = error;
        if (error.code === 1 || best || retryFinished) finish(error.code === 1 || !best ? error : undefined);
      }
    });
  } finally {
    acceptingInitial = false;
    acceptLateInitial = null;
    queuedLateInitial = null;
  }
}

export async function resolveAddressAtPosition(directory, point, signal) {
  if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
  const coarse = point.mode !== 'pin' && (!Number.isFinite(point.accuracy) || point.accuracy <= 0 || point.accuracy > 150);
  // An imprecise fix needs a pin confirmation, not a multi-megabyte boundary
  // download that cannot make the device's coordinates more accurate.
  if (coarse) return { area: null, reliable: false, address: '', coarse: true };
  const area = await locateAdministrativeArea(directory, point, { signal }).catch(error => { if (signal.aborted) throw error; return null; });
  if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
  if (area && !area.reliable) return { area, reliable: false, address: '', coarse: false };
  let result;
  try {
    const response = await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reverseGeocode', lat: point.lat, lon: point.lon }), signal: AbortSignal.any([signal, AbortSignal.timeout(11000)]) });
    if (!response.ok) throw new Error('No street address');
    const data = await response.json();
    result = { ...normalizeReverseAddress(directory, data), addressDistance: data.featureDistanceMeters ?? data.addressDistance };
  } catch {
    if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
    // A locality-only provider cannot improve a verified local boundary result.
    if (!area) {
      try {
        const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${point.lat}&longitude=${point.lon}&localityLanguage=vi`, { signal: AbortSignal.any([signal, AbortSignal.timeout(7000)]) });
        if (response.ok) result = normalizeReverseAddress(directory, parseBigDataCloudAddress(await response.json()));
      } catch { /* The map and manual address entry remain available. */ }
    }
  }
  const sameWard = area && (!result?.countryCode || result.countryCode === 'vn') && (!result?.wardCode || result.wardCode === area.wardCode) && (!result?.provinceCode || result.provinceCode === area.provinceCode);
  const streetNearby = Number.isFinite(result?.addressDistance) && result.addressDistance <= 150;
  let address = sameWard && streetNearby ? result.address : '';
  const parts = { ...(sameWard ? result?.addressParts : {}), ward: area?.ward || '', province: area?.city || '' };
  const houseReliable = streetNearby && result.addressDistance <= 25 && (point.mode === 'pin' || (point.accuracy > 0 && point.accuracy <= 30));
  if (!houseReliable) { parts.houseNumber = ''; parts.building = ''; }
  if (!sameWard || !streetNearby) { parts.houseNumber = ''; parts.road = ''; parts.building = ''; }
  // Coordinates identify a point, not necessarily the nearest indexed house.
  // A medium-accuracy device fix may suggest a street but never a house number.
  if (sameWard && streetNearby && result?.addressParts && !houseReliable) address = formatAddressDetails(parts);
  const precision = parts.houseNumber && address ? 'house' : parts.road && address ? 'street' : address || area ? 'locality' : 'missing';
  const missingParts = [!parts.houseNumber && 'houseNumber', !(parts.road || parts.hamlet || parts.neighbourhood || parts.residential) && 'road', !area?.ward && 'ward', !area?.city && 'province'].filter(Boolean);
  const addressDetails = { parts, precision, missingParts, featureDistanceMeters: Number.isFinite(result?.addressDistance) ? result.addressDistance : null, source: result?.source || '' };
  return { area, reliable: Boolean(area?.reliable), address, addressDetails, countryCode: result?.countryCode, source: result?.source || '', coarse: false };
}
