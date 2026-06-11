const BASE = '/api';

const getToken = () => {
  const session = localStorage.getItem('session');
  return session ? JSON.parse(session).token : null;
};

const headers = (extra = {}) => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
  ...extra,
});

const handle = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro na requisição');
  return data;
};

export const api = {
  get: (path) => fetch(`${BASE}${path}`, { headers: headers() }).then(handle),
  post: (path, body) => fetch(`${BASE}${path}`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(handle),
  put: (path, body) => fetch(`${BASE}${path}`, { method: 'PUT', headers: headers(), body: JSON.stringify(body) }).then(handle),
  patch: (path, body = {}) => fetch(`${BASE}${path}`, { method: 'PATCH', headers: headers(), body: JSON.stringify(body) }).then(handle),
  delete: (path) => fetch(`${BASE}${path}`, { method: 'DELETE', headers: headers() }).then(handle),
};
