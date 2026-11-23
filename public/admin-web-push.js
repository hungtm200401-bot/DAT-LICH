const apiPath = '/api/admin-push';

function applicationServerKey(publicKey) {
  return Uint8Array.from(atob(publicKey.replace(/-/g, '+').replace(/_/g, '/')), char => char.charCodeAt(0));
}

export function createAdminWebPush({ isAuthorized, refresh, toast }) {
  let registration = null;
  let publicKey = '';
  let enabled = false;
  let checked = false;
  let checking = false;
  let busy = false;
  let revision = 0;

  async function request(method = 'GET', data) {
    const options = { method, credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(10000) };
    if (data) {
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify(data);
    }
    const response = await fetch(apiPath, options);
    if (!response.ok) {
      const error = new Error((await response.json().catch(() => ({}))).error || 'Chưa thể gửi thông báo. Vui lòng thử lại.');
      error.status = response.status;
      throw error;
    }
    return response.json();
  }

  function controls() {
    if (!checked) return '';
    if (Notification.permission === 'denied') {
      return '<p class="ma-push-status">Mở Cài đặt → Thông báo → HOÀN Admin để cấp quyền.</p>';
    }
    const disabled = busy ? ' disabled' : '';
    if (enabled) {
      return '<span class="ma-push-status">Đã bật báo lịch</span>' +
        '<button class="ma-btn" type="button" data-admin-push-action="test"' + disabled + '>Gửi thử</button>' +
        '<button class="ma-btn ghost" type="button" data-admin-push-action="disable"' + disabled + '>Tắt</button>';
    }
    if (publicKey && registration) {
      return '<button class="ma-btn" type="button" data-admin-push-action="enable"' + disabled + '>Bật thông báo</button>';
    }
    return '<button class="ma-btn" type="button" data-admin-push-action="retry"' + disabled + '>Tải lại thông báo</button>';
  }

  function repaint() {
    document.querySelectorAll('[data-hoan-push-controls]').forEach(element => {
      element.innerHTML = controls();
    });
  }

  async function load(force = false) {
    if (!isAuthorized() || checking || checked && !force) return;
    checking = true;
    const attempt = revision;
    try {
      const config = await request();
      registration = config.available ? await navigator.serviceWorker.getRegistration('/') : null;
      if (config.available && !registration?.active) {
        await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
        const timeout = new Promise(resolve => setTimeout(() => resolve(null), 8_000));
        registration = await Promise.race([navigator.serviceWorker.ready, timeout]);
      }
      if (!isAuthorized() || revision !== attempt) return;
      let current = await registration?.pushManager.getSubscription();
      const key = config.publicKey || '';
      if (current?.options.applicationServerKey && key &&
          new Uint8Array(current.options.applicationServerKey).join() !== applicationServerKey(key).join()) {
        await current.unsubscribe();
        current = null;
      }
      if (!isAuthorized() || revision !== attempt) return;
      publicKey = key;
      enabled = Boolean(config.enabled && current && Notification.permission === 'granted');
    } catch {
      if (revision !== attempt) return;
      publicKey = '';
    } finally {
      checking = false;
      if (revision === attempt && isAuthorized()) {
        checked = true;
        repaint();
      }
    }
  }

  async function operate(action) {
    if (busy || !isAuthorized()) return;
    busy = true;
    const attempt = revision;
    try {
      // Safari requires the subscription promise to start in the tap itself.
      const subscriptionTask = action === 'enable' && registration && publicKey
        ? registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: applicationServerKey(publicKey) })
        : null;
      repaint();
      if (subscriptionTask) {
        const subscription = await subscriptionTask;
        if (revision !== attempt || !isAuthorized()) {
          await subscription.unsubscribe();
          return;
        }
        await request('POST', { action: 'subscribe', publicKey, subscription: subscription.toJSON() });
        if (revision === attempt) {
          enabled = true;
          toast('Đã bật thông báo lịch mới.');
        }
      } else if (action === 'disable') {
        await request('DELETE');
        const current = await registration?.pushManager.getSubscription();
        await current?.unsubscribe().catch(() => {});
        enabled = false;
        toast('Đã tắt báo lịch trên thiết bị này.');
      } else if (action === 'test') {
        await request('POST', { action: 'test' });
        toast('Đã gửi thông báo thử.');
      } else if (action === 'retry') {
        await load(true);
      }
    } catch (error) {
      if (revision !== attempt) return;
      if (error.status === 410) {
        enabled = false;
        const current = await registration?.pushManager.getSubscription();
        await current?.unsubscribe().catch(() => {});
      }
      toast(Notification.permission === 'denied' ? 'Hãy cấp quyền thông báo trong Cài đặt iPhone.' :
        error.name === 'NotAllowedError' ? 'Vui lòng cho phép HOÀN gửi thông báo.' :
        error.message || 'Chưa thể bật thông báo. Vui lòng thử lại.');
    } finally {
      busy = false;
      repaint();
    }
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-admin-push-action]');
    if (!button) return;
    event.preventDefault();
    void operate(button.dataset.adminPushAction);
  });
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data?.type === 'hoan:admin-push' && isAuthorized()) void refresh();
  });
  window.addEventListener('focus', () => void load(true));

  function clearOnLogout() {
    revision++;
    checked = false;
    enabled = false;
    publicKey = '';
    // The server removes this installation in its own logout transaction.
    void navigator.serviceWorker.getRegistration('/').then(async reg => {
      const subscription = await reg?.pushManager.getSubscription();
      await subscription?.unsubscribe();
      const notices = await reg?.getNotifications();
      notices?.filter(item => item.tag.startsWith('hoan-admin-')).forEach(item => item.close());
    }).catch(() => {});
  }

  return { controls, load, clearOnLogout };
}
