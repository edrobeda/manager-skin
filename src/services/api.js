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
  // multipart — sem Content-Type manual, o navegador define o boundary sozinho.
  // Timeout evita spinner infinito quando a conexão trava no meio do envio (ex: rede lenta atrás de proxy)
  upload: (path, file) => {
    const form = new FormData();
    form.append('file', file);
    const token = getToken();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3 * 60 * 1000);

    return fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
      signal: controller.signal,
    })
      .then(handle)
      .catch((err) => {
        if (err.name === 'AbortError') throw new Error('Envio demorou demais e foi cancelado — tente de novo ou verifique sua conexão');
        throw err;
      })
      .finally(() => clearTimeout(timeoutId));
  },
};
