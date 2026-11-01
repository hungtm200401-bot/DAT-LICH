import test from 'node:test';
import assert from 'node:assert/strict';
import { acquireDevicePosition } from '../public/device-location.js';

const sample = (accuracy, values = {}) => ({
  coords: { latitude: 21.100123456, longitude: 105.500987654, accuracy },
  timestamp: Date.now(),
  ...values
});
const clock = context => context.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 1793440800000 });
const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
const permissionFixture = (state = 'prompt') => {
  const status = new EventTarget();
  status.state = state;
  const listeners = new Set();
  const add = status.addEventListener.bind(status), remove = status.removeEventListener.bind(status);
  status.addEventListener = (type, listener) => { if (type === 'change') listeners.add(listener); add(type, listener); };
  status.removeEventListener = (type, listener) => { if (type === 'change') listeners.delete(listener); remove(type, listener); };
  return {
    listeners,
    permissions: { query: async descriptor => { assert.equal(descriptor.name, 'geolocation'); return status; } },
    change(next) { status.state = next; status.dispatchEvent(new Event('change')); }
  };
};

test('a fresh precise device measurement is returned unchanged without a watch', async () => {
  const original = sample(12);
  let calls = 0;
  const result = await acquireDevicePosition({
    getCurrentPosition(success, _error, options) {
      calls++;
      assert.equal(options.enableHighAccuracy, true);
      assert.equal(options.maximumAge, 0);
      success(original);
    },
    watchPosition() { assert.fail('An accurate fresh fix must be immediate.'); }
  }, new AbortController().signal);
  assert.equal(calls, 1);
  assert.equal(result, original);
  assert.equal(result.timestamp, original.timestamp);
  assert.equal(result.coords.latitude, 21.100123456);
});

test('a stale precise first fix is discarded before a fresh watch measurement is selected', async () => {
  const stale = sample(5, { timestamp: Date.now() - 60000 });
  const fresh = sample(18, { coords: { latitude: 10.1234567, longitude: 106.7654321, accuracy: 18 } });
  const cleared = [];
  const result = await acquireDevicePosition({
    getCurrentPosition(success) { success(stale); },
    watchPosition(success, _error, options) {
      assert.equal(options.enableHighAccuracy, true);
      assert.equal(options.maximumAge, 0);
      success(fresh);
      return 0;
    },
    clearWatch(id) { cleared.push(id); }
  }, new AbortController().signal);
  assert.equal(result, fresh);
  assert.deepEqual(cleared, [0], 'A synchronous success clears even watch ID zero exactly once.');
});

test('invalid coordinates, accuracy and supplied timestamps cannot become a device fix', async () => {
  const valid = sample(14);
  const invalid = [
    { coords: null },
    { coords: { ...valid.coords, latitude: NaN } },
    { coords: { ...valid.coords, latitude: 91 } },
    { coords: { ...valid.coords, longitude: -181 } },
    { coords: { ...valid.coords, longitude: '105.5' } },
    { coords: { ...valid.coords, accuracy: 0 } },
    { coords: { ...valid.coords, accuracy: -1 } },
    { coords: { ...valid.coords, accuracy: Infinity } },
    { coords: { ...valid.coords, accuracy: NaN } },
    { timestamp: undefined },
    { timestamp: null },
    { timestamp: NaN },
    { timestamp: Date.now() + 60000 }
  ];
  for (const values of invalid) {
    let watches = 0;
    const result = await acquireDevicePosition({
      getCurrentPosition(success) { success({ ...valid, ...values }); },
      watchPosition(success) { watches++; success(valid); return 1; },
      clearWatch() {}
    }, new AbortController().signal);
    assert.equal(watches, 1);
    assert.equal(result, valid);
  }
});

test('watch refinement keeps the best actual sample and ignores stale or reordered readings', async context => {
  clock(context);
  const initial = sample(600, { timestamp: Date.now() - 3000 });
  const improved = sample(85, { timestamp: Date.now() - 1000 });
  const reordered = sample(5, { timestamp: Date.now() - 2000 });
  const stale = sample(1, { timestamp: Date.now() - 60000 });
  let deliver;
  const cleared = [];
  const promise = acquireDevicePosition({
    getCurrentPosition(success) { success(initial); },
    watchPosition(success, _error, options) { deliver = success; assert.ok(options.timeout > 6000); return 3; },
    clearWatch(id) { cleared.push(id); }
  }, new AbortController().signal);
  await flush();
  deliver(improved);
  deliver(stale);
  deliver(reordered);
  deliver(sample(900));
  context.mock.timers.tick(18000);
  assert.equal(await promise, improved);
  assert.deepEqual(cleared, [3]);
});

test('a single implausible precise jump cannot displace a useful fix', async context => {
  clock(context);
  const initial = sample(85);
  let deliver;
  const promise = acquireDevicePosition({
    getCurrentPosition(success) { success(initial); },
    watchPosition(success) { deliver = success; return 4; },
    clearWatch() {}
  }, new AbortController().signal);
  await flush();
  context.mock.timers.tick(1000);
  deliver(sample(6, { coords: { latitude: 10.2, longitude: 106.3, accuracy: 6 } }));
  context.mock.timers.tick(17000);
  assert.equal(await promise, initial);
});

test('one fresh precise sample immediately replaces a coarse network fix even over ten kilometres away', async context => {
  clock(context);
  const initial = sample(997);
  const precise = sample(12, { coords: { latitude: 21.200123456, longitude: 105.500987654, accuracy: 12 } });
  const readings = [], cleared = [];
  const result = await acquireDevicePosition({
    getCurrentPosition(success) { success(initial); },
    watchPosition(success) { success(precise); return 14; },
    clearWatch(id) { cleared.push(id); }
  }, new AbortController().signal, position => readings.push(position));
  assert.equal(result, precise);
  assert.deepEqual(readings, [initial, precise]);
  assert.deepEqual(cleared, [14]);
});

test('a repeated consistent new location can replace a wrong earlier fix without averaging coordinates', async context => {
  clock(context);
  const initial = sample(85);
  let deliver;
  const cleared = [];
  const promise = acquireDevicePosition({
    getCurrentPosition(success) { success(initial); },
    watchPosition(success) { deliver = success; return 5; },
    clearWatch(id) { cleared.push(id); }
  }, new AbortController().signal);
  await flush();
  context.mock.timers.tick(1000);
  const correct = sample(8, { coords: { latitude: 10.20001234, longitude: 106.30004321, accuracy: 8 } });
  deliver(correct);
  context.mock.timers.tick(1000);
  deliver(sample(10, { coords: { latitude: 10.20001234, longitude: 106.30004321, accuracy: 10 } }));
  assert.equal(await promise, correct);
  assert.equal(correct.timestamp, Date.now() - 1000);
  assert.deepEqual(cleared, [5]);
});

test('watch timeout returns honest coarse accuracy when the device cannot improve it', async context => {
  clock(context);
  const coarse = sample(5000);
  let watchError;
  const cleared = [];
  const promise = acquireDevicePosition({
    getCurrentPosition(success) { success(coarse); },
    watchPosition(_success, error) { watchError = error; return 6; },
    clearWatch(id) { cleared.push(id); }
  }, new AbortController().signal);
  await flush();
  watchError({ code: 2, message: 'Temporarily unavailable' });
  context.mock.timers.tick(7000);
  let settled = false;
  promise.then(() => { settled = true; });
  await flush();
  assert.equal(settled, false, 'The watch allows the GPS more than six seconds to recover.');
  context.mock.timers.tick(11000);
  assert.equal(await promise, coarse);
  assert.equal(coarse.coords.accuracy, 5000);
  assert.deepEqual(cleared, [6]);
});

test('an equally accurate newer fix replaces a reading that would otherwise become stale', async context => {
  clock(context);
  const initial = sample(85, { timestamp: Date.now() - 20000 });
  let deliver;
  const promise = acquireDevicePosition({
    getCurrentPosition(success) { success(initial); },
    watchPosition(success) { deliver = success; return 12; },
    clearWatch() {}
  }, new AbortController().signal);
  await flush();
  context.mock.timers.tick(1000);
  const recent = sample(85);
  deliver(recent);
  context.mock.timers.tick(17000);
  assert.equal(await promise, recent);
});

test('a fix that expires during sampling cannot be returned as the current device position', async context => {
  clock(context);
  const promise = acquireDevicePosition({
    getCurrentPosition(success) { success(sample(85, { timestamp: Date.now() - 20000 })); },
    watchPosition() { return 13; },
    clearWatch() {}
  }, new AbortController().signal);
  const rejected = assert.rejects(promise, { code: 3 });
  await flush();
  context.mock.timers.tick(18000);
  await rejected;
});

test('watching can recover from a failed initial high accuracy request', async () => {
  const recovered = sample(9);
  const modes = [];
  const result = await acquireDevicePosition({
    getCurrentPosition(_success, error, options) { modes.push(options.enableHighAccuracy); error({ code: 2 }); },
    watchPosition(success, _error, options) { assert.equal(options.enableHighAccuracy, true); success(recovered); return 7; },
    clearWatch() {}
  }, new AbortController().signal);
  assert.equal(result, recovered);
  assert.deepEqual(modes, [true, false]);
});

test('one attempt automatically recovers a timed-out primary request with a fresh browser fallback', async context => {
  clock(context);
  const modes = [], stages = [], readings = [];
  let fallback;
  const cleared = [];
  const promise = acquireDevicePosition({
    getCurrentPosition(success, _error, options) {
      modes.push(options.enableHighAccuracy);
      assert.equal(options.maximumAge, 0);
      if (!options.enableHighAccuracy) {
        assert.equal(options.timeout, 6000);
        fallback = success;
      }
    },
    watchPosition(_success, _error, options) {
      assert.equal(options.enableHighAccuracy, true);
      return 15;
    },
    clearWatch(id) { cleared.push(id); }
  }, new AbortController().signal, position => readings.push(position), stage => stages.push(stage));
  context.mock.timers.tick(12000);
  await flush();
  const recovered = sample(12);
  fallback(recovered);
  assert.equal(await promise, recovered);
  assert.deepEqual(modes, [true, false], 'Recovery is automatic within the same acquire call.');
  assert.deepEqual(readings, [recovered]);
  assert.deepEqual(stages, ['locating', 'retrying']);
  assert.deepEqual(cleared, [15]);
});

test('a fresh cold-start result from the first request remains usable during automatic recovery', async context => {
  clock(context);
  const requests = [], readings = [], cleared = [];
  const promise = acquireDevicePosition({
    getCurrentPosition(success, error, options) { requests.push({ success, error, options }); },
    watchPosition() { return 19; },
    clearWatch(id) { cleared.push(id); }
  }, new AbortController().signal, position => readings.push(position));
  context.mock.timers.tick(12000); await flush();
  assert.equal(requests.length, 2, 'Recovery starts automatically while the original native call is still pending.');
  context.mock.timers.tick(2000);
  const recovered = sample(12);
  requests[0].success(recovered);
  assert.equal(await promise, recovered, 'The actual late native measurement is retained unchanged.');
  assert.deepEqual(readings, [recovered]);
  assert.deepEqual(cleared, [19]);
  requests[1].success(sample(5));
  requests[0].success(sample(3));
  assert.deepEqual(readings, [recovered], 'No native callback can publish after this attempt has completed.');
});

test('late primary results still obey freshness, measurement quality and final recovery deadline', async context => {
  clock(context);
  const requests = [], readings = [];
  const promise = acquireDevicePosition({
    getCurrentPosition(success) { requests.push(success); },
    watchPosition() { return 20; }, clearWatch() {}
  }, new AbortController().signal, position => readings.push(position));
  const rejected = assert.rejects(promise, { code: 3 });
  context.mock.timers.tick(12000); await flush();
  requests[0](sample(5, { timestamp: Date.now() - 60000 }));
  requests[0](sample(0));
  assert.deepEqual(readings, [], 'An old or invalid late native measurement cannot become current.');
  context.mock.timers.tick(18000); await rejected;
  requests[0](sample(5));
  assert.deepEqual(readings, [], 'A result arriving after the whole attempt ends remains ignored.');
  assert.equal(Date.now(), 1793440800000 + 30000);
});

test('a fresh first result racing its watchdog is carried into recovery without being lost', async context => {
  clock(context);
  let deliver, calls = 0;
  const promise = acquireDevicePosition({ getCurrentPosition(success) { calls++; deliver = success; } }, new AbortController().signal);
  context.mock.timers.tick(12000);
  const recovered = sample(12);
  deliver(recovered); // Before the rejected first request resumes its async continuation.
  assert.equal(await promise, recovered);
  assert.equal(calls, 1, 'A queued precise fix avoids another provider request.');
});

test('cancelling recovery also ignores a subsequently successful original native request', async context => {
  clock(context);
  const controller = new AbortController(), requests = [], readings = [], cleared = [];
  const promise = acquireDevicePosition({
    getCurrentPosition(success) { requests.push(success); },
    watchPosition() { return 21; }, clearWatch(id) { cleared.push(id); }
  }, controller.signal, position => readings.push(position));
  const rejected = assert.rejects(promise, { name: 'AbortError' });
  context.mock.timers.tick(12000); await flush();
  controller.abort();
  requests[0](sample(5)); requests[1](sample(8));
  await rejected;
  assert.deepEqual(readings, []);
  assert.deepEqual(cleared, [21]);
});

test('waiting for location permission does not consume acquisition time or start duplicate requests', async context => {
  clock(context);
  const permission = permissionFixture(), requests = [], stages = [];
  const promise = acquireDevicePosition({
    getCurrentPosition(success, error, options) { requests.push({ success, error, options }); },
    watchPosition() { assert.fail('The receiver has not needed refinement.'); }
  }, new AbortController().signal, undefined, stage => stages.push(stage), { permissions: permission.permissions });
  await flush();
  context.mock.timers.tick(60000); await flush();
  assert.equal(requests.length, 1, 'Only the user-initiated native request waits on the browser prompt.');
  assert.deepEqual(stages, ['locating', 'permission']);
  permission.change('granted');
  context.mock.timers.tick(8000);
  const measured = sample(12);
  requests[0].success(measured);
  assert.equal(await promise, measured);
  assert.deepEqual(stages, ['locating', 'permission', 'locating']);
  assert.equal(permission.listeners.size, 0, 'Permission listeners are removed on success.');
});

test('the receiver remains bounded to thirty seconds after delayed permission is granted', async context => {
  clock(context);
  const permission = permissionFixture(), requests = [], cleared = [];
  const promise = acquireDevicePosition({
    getCurrentPosition(_success, _error, options) { requests.push(options); },
    watchPosition() { return 22; }, clearWatch(id) { cleared.push(id); }
  }, new AbortController().signal, undefined, undefined, { permissions: permission.permissions });
  const rejected = assert.rejects(promise, { code: 3 });
  await flush();
  context.mock.timers.tick(45000); await flush();
  assert.equal(requests.length, 1);
  permission.change('granted');
  context.mock.timers.tick(12000); await flush();
  assert.equal(requests.length, 2);
  context.mock.timers.tick(18000); await rejected;
  assert.equal(Date.now(), 1793440800000 + 45000 + 30000);
  assert.equal(permission.listeners.size, 0);
  assert.deepEqual(cleared, [22]);
});

test('native permission denial after a delayed prompt ends the same attempt without retrying', async context => {
  clock(context);
  const permission = permissionFixture(), requests = [], stages = [];
  const denied = { code: 1, message: 'Permission denied' };
  const promise = acquireDevicePosition({
    getCurrentPosition(success, error) { requests.push({ success, error }); },
    watchPosition() { assert.fail('Denial must not start a watch.'); }
  }, new AbortController().signal, undefined, stage => stages.push(stage), { permissions: permission.permissions });
  const rejected = assert.rejects(promise, error => error === denied);
  await flush();
  context.mock.timers.tick(60000); await flush();
  permission.change('denied');
  requests[0].error(denied);
  await rejected;
  assert.equal(requests.length, 1);
  assert.equal(permission.listeners.size, 0);
  assert.ok(!stages.includes('retrying'));
});

test('cancelling while the permission prompt is open cleans listeners and ignores late grant and fixes', async context => {
  clock(context);
  const permission = permissionFixture(), controller = new AbortController(), readings = [], stages = [];
  let deliver, calls = 0;
  const promise = acquireDevicePosition({
    getCurrentPosition(success) { calls++; deliver = success; },
    watchPosition() { assert.fail('A cancelled prompt must not start a watch.'); }
  }, controller.signal, position => readings.push(position), stage => stages.push(stage), { permissions: permission.permissions });
  const rejected = assert.rejects(promise, { name: 'AbortError' });
  await flush();
  context.mock.timers.tick(45000);
  controller.abort();
  permission.change('granted'); deliver(sample(8));
  context.mock.timers.tick(30000); await rejected;
  assert.equal(permission.listeners.size, 0);
  assert.equal(calls, 1);
  assert.deepEqual(readings, []);
  assert.deepEqual(stages, ['locating', 'permission']);
});

test('unsupported or stale permission status cannot overrule a successful native measurement', async () => {
  const measured = sample(12);
  const permissionSources = [
    { query() { throw new Error('Permissions unsupported'); } },
    { query: async () => { throw new Error('Permission query unavailable'); } },
    permissionFixture('denied').permissions
  ];
  for (const permissions of permissionSources) {
    const result = await acquireDevicePosition({
      getCurrentPosition(success) { queueMicrotask(() => success(measured)); }
    }, new AbortController().signal, undefined, undefined, { permissions });
    assert.equal(result, measured);
  }
});

test('a permission query without change notifications keeps the bounded acquisition watchdog', async context => {
  clock(context);
  let calls = 0;
  const promise = acquireDevicePosition({ getCurrentPosition() { calls++; } }, new AbortController().signal, undefined, undefined, { permissions: { query: async () => ({ state: 'prompt' }) } });
  const rejected = assert.rejects(promise, { code: 3 });
  await flush();
  context.mock.timers.tick(12000); await flush();
  context.mock.timers.tick(18000); await rejected;
  assert.equal(calls, 2);
});

test('a coarse fallback preserves its actual accuracy and timestamp while high accuracy refinement continues', async context => {
  clock(context);
  const coarse = sample(997);
  const readings = [], stages = [];
  let deliver;
  const promise = acquireDevicePosition({
    getCurrentPosition(success, error, options) {
      if (options.enableHighAccuracy) error({ code: 2 });
      else success(coarse);
    },
    watchPosition(success) { deliver = success; return 16; },
    clearWatch() {}
  }, new AbortController().signal, position => readings.push(position), stage => stages.push(stage));
  await flush();
  assert.deepEqual(readings, [coarse], 'The recovered measurement is available before refinement finishes.');
  assert.deepEqual(stages, ['locating', 'retrying', 'refining']);
  context.mock.timers.tick(1000);
  deliver(sample(5, { timestamp: Date.now() - 60000 }));
  context.mock.timers.tick(17000);
  assert.equal(await promise, coarse);
  assert.equal(coarse.coords.accuracy, 997);
  assert.equal(coarse.timestamp, 1793440800000);
  assert.deepEqual(readings, [coarse]);
});

test('a fallback callback arriving after its deadline cannot replace a selected current measurement', async context => {
  clock(context);
  const useful = sample(85);
  const readings = [];
  let fallback;
  const promise = acquireDevicePosition({
    getCurrentPosition(success, error, options) {
      if (options.enableHighAccuracy) error({ code: 3 });
      else fallback = success;
    },
    watchPosition(success) { success(useful); return 18; },
    clearWatch() {}
  }, new AbortController().signal, position => readings.push(position));
  await flush();
  context.mock.timers.tick(6000);
  fallback(sample(5));
  context.mock.timers.tick(12000);
  assert.equal(await promise, useful);
  assert.deepEqual(readings, [useful]);
});

test('a browser fallback can still finish when starting the high accuracy watch throws', async () => {
  const fallbackFix = sample(997);
  let fallback;
  const promise = acquireDevicePosition({
    getCurrentPosition(success, error, options) {
      if (options.enableHighAccuracy) error({ code: 2 });
      else fallback = success;
    },
    watchPosition() { throw Object.assign(new Error('Watch unavailable'), { code: 2 }); }
  }, new AbortController().signal);
  await flush();
  fallback(fallbackFix);
  assert.equal(await promise, fallbackFix);
});

test('progress exposes only selected actual measurements while refinement continues', async context => {
  clock(context);
  const initial = sample(500);
  const improved = sample(16);
  const readings = [];
  const result = await acquireDevicePosition({
    getCurrentPosition(success) { success(initial); },
    watchPosition(success) {
      success(sample(5, { timestamp: Date.now() - 60000 }));
      success(sample(900));
      success(improved);
      return 11;
    },
    clearWatch() {}
  }, new AbortController().signal, position => readings.push(position));
  assert.deepEqual(readings, [initial, improved]);
  assert.equal(readings[0], initial);
  assert.equal(readings[1], improved);
  assert.equal(result, improved);
});

test('a stalled device request and watch end with a bounded error instead of invented coordinates', async context => {
  clock(context);
  const cleared = [], modes = [], readings = [];
  const promise = acquireDevicePosition({
    getCurrentPosition(_success, _error, options) { modes.push(options.enableHighAccuracy); },
    watchPosition() { return 8; },
    clearWatch(id) { cleared.push(id); }
  }, new AbortController().signal, position => readings.push(position));
  const rejected = assert.rejects(promise, { code: 3 });
  context.mock.timers.tick(12000);
  await flush();
  context.mock.timers.tick(18000);
  await rejected;
  assert.equal(Date.now(), 1793440800000 + 30000);
  assert.deepEqual(modes, [true, false]);
  assert.deepEqual(readings, []);
  assert.deepEqual(cleared, [8]);
});

test('permission denial never starts another measurement', async () => {
  const denied = { code: 1, message: 'Permission denied' };
  let calls = 0;
  const stages = [];
  await assert.rejects(acquireDevicePosition({
    getCurrentPosition(_success, error) { calls++; error(denied); },
    watchPosition() { assert.fail('Permission denial must stop sampling.'); }
  }, new AbortController().signal, undefined, stage => stages.push(stage)), error => error === denied);
  assert.equal(calls, 1);
  assert.deepEqual(stages, ['locating']);
});

test('aborting automatic recovery clears its watch and ignores late fallback and watch callbacks', async context => {
  clock(context);
  const controller = new AbortController();
  let fallback, deliver;
  const cleared = [], readings = [], stages = [];
  const promise = acquireDevicePosition({
    getCurrentPosition(success, error, options) {
      if (options.enableHighAccuracy) error({ code: 3 });
      else fallback = success;
    },
    watchPosition(success) { deliver = success; return 17; },
    clearWatch(id) { cleared.push(id); }
  }, controller.signal, position => readings.push(position), stage => stages.push(stage));
  const rejected = assert.rejects(promise, { name: 'AbortError' });
  await flush();
  controller.abort();
  fallback(sample(7));
  deliver(sample(5));
  context.mock.timers.tick(30000);
  await rejected;
  assert.deepEqual(cleared, [17]);
  assert.deepEqual(readings, []);
  assert.deepEqual(stages, ['locating', 'retrying']);
});

test('aborting the first request rejects and ignores its late success', async () => {
  const controller = new AbortController();
  let deliver;
  const promise = acquireDevicePosition({
    getCurrentPosition(success) { deliver = success; },
    watchPosition() { assert.fail('A cancelled request cannot start a watch.'); }
  }, controller.signal);
  const rejected = assert.rejects(promise, { name: 'AbortError' });
  controller.abort();
  deliver(sample(5));
  await rejected;
});

test('aborting refinement rejects instead of committing an earlier or late GPS sample', async () => {
  const controller = new AbortController();
  let deliver;
  const cleared = [];
  const promise = acquireDevicePosition({
    getCurrentPosition(success) { success(sample(500)); },
    watchPosition(success) { deliver = success; return 9; },
    clearWatch(id) { cleared.push(id); }
  }, controller.signal);
  const rejected = assert.rejects(promise, { name: 'AbortError' });
  await flush();
  controller.abort();
  deliver(sample(3));
  controller.abort();
  await rejected;
  assert.deepEqual(cleared, [9]);
});

test('aborting within a synchronous watch callback also clears its eventual watch ID once', async () => {
  const controller = new AbortController();
  const cleared = [];
  await assert.rejects(acquireDevicePosition({
    getCurrentPosition(success) { success(sample(500)); },
    watchPosition(success) { controller.abort(); success(sample(3)); return 10; },
    clearWatch(id) { cleared.push(id); }
  }, controller.signal), { name: 'AbortError' });
  assert.deepEqual(cleared, [10]);
});

test('a position without a measurement timestamp is rejected before publishing progress', async () => {
  const measurement = { coords: { latitude: 0, longitude: 0, accuracy: 12 } };
  const readings = [];
  await assert.rejects(acquireDevicePosition({ getCurrentPosition(success) { success(measurement); } }, new AbortController().signal, position => readings.push(position)), { code: 2 });
  assert.deepEqual(readings, []);
  assert.equal(Object.hasOwn(measurement, 'timestamp'), false);
});
