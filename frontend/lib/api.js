import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'dt_token';

export const tokenStore = {
  get: () => Cookies.get(TOKEN_KEY),
  set: (token) => Cookies.set(TOKEN_KEY, token, { expires: 7, sameSite: 'Lax' }),
  clear: () => Cookies.remove(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// fetch wrapper: adds the JWT, parses JSON, throws ApiError, and on a 401 clears
// the token and sends the user back to /login.
export async function apiFetch(path, { method = 'GET', body, params, signal } = {}) {
  const url = new URL(`${API_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    });
  }

  const token = tokenStore.get();
  const res = await fetch(url.toString(), {
    method,
    signal,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && typeof window !== 'undefined') {
    tokenStore.clear();
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
  }

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!res.ok) {
    throw new ApiError(data?.message || `Request failed (${res.status})`, res.status, data?.errors);
  }
  return data;
}

// SWR fetcher
export const swrFetcher = (key) => {
  const [path, paramsJson] = Array.isArray(key) ? key : [key];
  return apiFetch(path, { params: paramsJson ? JSON.parse(paramsJson) : undefined });
};
