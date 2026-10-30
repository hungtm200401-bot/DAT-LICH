// Serialize writes and capture each request's page/revision before awaiting the network.
export function createContentPersistence({ request, snapshot, setBusy, onDraft, onStatus, toast }) {
  let busy = false;
  const setSaving = value => { busy = value; setBusy(value); };
  async function saveDraft(silent = false) {
    const state = snapshot();
    if (!state.dirty) return true;
    if (busy) return false;
    setSaving(true); onStatus('Đang lưu bản nháp…', state);
    try {
      const result = await request('/api/site-content', { action: 'draft', path: state.path, fields: state.fields, revision: state.revision }, true);
      onDraft(state, result.draft);
      const latest = snapshot();
      onStatus(JSON.stringify(latest.fields) === JSON.stringify(state.fields) ? 'Bản nháp đã tự lưu · khách chưa thấy' : 'Đang có thay đổi · chưa lưu hết bản nháp', state);
      if (!silent) toast('Đã lưu bản nháp. Website công khai chưa thay đổi.');
      return true;
    } catch (error) {
      onStatus(error.message, state); if (!silent) toast(error.message); return false;
    } finally { setSaving(false); }
  }
  async function publish(state) {
    if (busy) throw new Error('Đang lưu nội dung. Vui lòng thử lại sau giây lát.');
    setSaving(true);
    try { return await request('/api/site-content', { action: 'publish', ...state }, true); }
    finally { setSaving(false); }
  }
  return { saveDraft, publish };
}
