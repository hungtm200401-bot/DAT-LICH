import { locateAdministrativeArea } from './location-boundaries.js?v=3.0';
import { normalizeReverseAddress, formatAddressDetails } from './location-utils.js?v=6.0';

const preciseAccuracy = 30;
const usableAccuracy = 60;
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
      const startDeadline = (delay = 12000) => {
        if (finished) return;
        clearTimeout(timer);
        timer = setTimeout(() => {
          timedOut = true;
          finish(reject, positionError(3, 'Device position timed out.'));
        }, delay);
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
                startDeadline(permissionStatus.state === 'granted' ? 4000 : 12000);
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
    if (best?.coords.accuracy <= preciseAccuracy) return best;
    const retry = !best;
    const canWatch = typeof geolocation.watchPosition === 'function';
    if (!retry && !canWatch) return best;
    return await new Promise((resolve, reject) => {
      let watchId, assigned = false, cleared = false, timer, retryTimer, settleTimer, finished = false, pending;
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
        clearTimeout(settleTimer);
        signal.removeEventListener('abort', abort);
        clearWatch();
        if (signal.aborted) reject(positionAbort());
        else if (error) reject(error);
        else if (isCurrentPosition(best)) resolve(best);
        else reject(lastError || positionError(3, 'No current device position was received.'));
      };
      const abort = () => finish(positionAbort());
      signal.addEventListener('abort', abort, { once: true });
      const settleUsablePosition = () => {
        if (settleTimer == null && best?.coords.accuracy <= usableAccuracy) {
          settleTimer = setTimeout(finish, 2500);
        }
      };
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
        if (best.coords.accuracy <= preciseAccuracy) finish();
        else {
          settleUsablePosition();
          if (watching) reportStage('refining');
        }
        return true;
      };
      acceptLateInitial = select;
      // A GPS receiver may need more than a few seconds to replace a network fix.
      // Retry the browser's other location mode concurrently so the whole attempt
      // stays within 30 seconds, even when both device providers stop responding.
      // Keep original samples and accuracy estimates; never average a location.
      timer = setTimeout(() => finish(), 18000);
      settleUsablePosition();
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

export function checkLocationArea(directory, point, signal) {
  const deadline = AbortSignal.any([signal, AbortSignal.timeout(6500)]);
  return locateAdministrativeArea(directory, point, { signal: deadline }).catch(() => null);
}

export async function resolveAddressAtPosition(directory, point, signal, { areaLookup, onReverseLookup } = {}) {
  if (signal.aborted) throw positionAbort();
  const coarse = point.mode !== 'pin' && (!Number.isFinite(point.accuracy) || point.accuracy <= 0 || point.accuracy > 150);
  // Defer boundary downloads until the device reports a usable measurement.
  if (coarse) return { area: null, reliable: false, address: '', coarse: true };
  const area = await (areaLookup || checkLocationArea(directory, point, signal));
  if (signal.aborted) throw positionAbort();
  if (!area?.reliable) return { area, reliable: false, address: '', coarse: false };
  let result;
  try {
    onReverseLookup?.();
    const response = await fetch('/api/data', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reverseGeocode', lat: point.lat, lon: point.lon }),
      signal: AbortSignal.any([signal, AbortSignal.timeout(6000)]),
    });
    if (response.ok) result = normalizeReverseAddress(directory, await response.json());
  } catch { /* A verified ward remains available when street data is missing. */ }
  if (signal.aborted) throw positionAbort();
  const sameWard = !result || (result.countryCode === 'vn' &&
    (!result.wardCode || result.wardCode === area.wardCode) && (!result.provinceCode || result.provinceCode === area.provinceCode));
  const distance = result?.featureDistanceMeters ?? null;
  const streetLimit = point.mode === 'pin' ? 90 : Math.min(90, point.accuracy + 30);
  const streetNearby = distance !== null && distance <= streetLimit;
  const parts = { ...(sameWard && streetNearby ? result?.addressParts : {}), ward: area.ward, province: area.city };
  const houseReliable = streetNearby && distance <= 20 && (point.mode === 'pin' || point.accuracy <= preciseAccuracy);
  if (!houseReliable) { parts.houseNumber = ''; parts.building = ''; }
  const address = formatAddressDetails(parts);
  const precision = parts.houseNumber && address ? 'house' : parts.road && address ? 'street' : 'locality';
  const missingParts = [!parts.houseNumber && 'houseNumber', !address && 'road'].filter(Boolean);
  const source = result?.source || '';
  const addressDetails = { parts, precision, missingParts, featureDistanceMeters: distance, source };
  return { area, reliable: true, mismatch: !sameWard, address, addressDetails, countryCode: result?.countryCode, source, coarse: false };
}
