// Central API helper - handles token automatically from cookie/store
async function apiFetch(url, options = {}) {
  // Get token from cookie (JWT has = chars, so use indexOf not split)
  let token = null;
  if (typeof window !== 'undefined') {
    const match = document.cookie.split(';').find(c => c.trim().startsWith('digiboi_token='));
    if (match) {
      const idx = match.indexOf('=');
      token = idx !== -1 ? match.substring(idx + 1).trim() : null;
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(url, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'সার্ভারে সমস্যা হয়েছে');
  return data;
}

export const api = {
  get:    (url)         => apiFetch(url),
  post:   (url, body)   => apiFetch(url, { method: 'POST',  body: JSON.stringify(body) }),
  patch:  (url, body)   => apiFetch(url, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (url)         => apiFetch(url, { method: 'DELETE' }),
};

export default api;
