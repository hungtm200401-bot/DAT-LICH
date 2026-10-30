export function createCmsApi(adminHeaders) {
  return async function request(url, data, admin = false) {
    const response = await fetch(url, { cache: 'no-store', ...(data ? { method: 'POST', body: JSON.stringify(data) } : {}), headers: { ...(data ? { 'Content-Type': 'application/json' } : {}), ...(admin ? adminHeaders() : {}) } });
    const result = await response.json();
    if (!response.ok) throw Object.assign(new Error(result.error || 'Không thể kết nối máy chủ.'), { status: response.status });
    return result;
  };
}
