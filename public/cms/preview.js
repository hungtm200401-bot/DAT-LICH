export function createPreviewBridge({ frame, snapshot, onChange }) {
  return (overrides = {}, scrollY) => {
    const { path, fields, brand, settings, services, shared, dirty } = snapshot();
    frame()?.contentWindow?.postMessage({ type: 'hoan:preview', path, fields: { ...fields, ...overrides }, brand, settings, services, shared, ...(scrollY === undefined ? {} : { scrollY }) }, location.origin);
    if (dirty) onChange();
  };
}
