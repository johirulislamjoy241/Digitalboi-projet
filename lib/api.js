// Central API helper — auto-adds Authorization header from localStorage

const BASE = "";

async function request(url, options = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("digiboi_token") : null;
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(BASE + url, { ...options, headers });
  return res;
}

const api = {
  get:    (url)         => request(url),
  post:   (url, data)   => request(url, { method: "POST",  body: JSON.stringify(data) }),
  patch:  (url, data)   => request(url, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (url)         => request(url, { method: "DELETE" }),
};

export default api;
export { request as apiFetch };
