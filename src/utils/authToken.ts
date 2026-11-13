// Single source of truth for the Fivepa session token in the browser.
// Every component/hook reads, writes and clears the token through these helpers.
const TOKEN_KEY = 'workperhour_token';
// Legacy key written by older builds. Still read (so existing sessions survive) and always cleared.
const LEGACY_TOKEN_KEY = 'token';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  } catch {}
}

export function clearAuthToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  } catch {}
}

export function decodeTokenPayload(token: string | null): { id?: string; role?: string; exp?: number } | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (!parts[1] || typeof atob !== 'function') return null;
    let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4 !== 0) {
      b64 += '=';
    }
    return JSON.parse(atob(b64));
  } catch {
    return null;
  }
}

export function isTokenStructurallyValid(token: string | null): boolean {
  const payload = decodeTokenPayload(token);
  if (!payload || !payload.id) return false;
  if (typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now()) {
    return false;
  }
  return true;
}

const inFlightDemoSessions = new Map<string, Promise<{ token: string; user: any } | null>>();

/** Dev/test only: asks the server for a real signed session for a non-privileged demo user. */
export async function requestDemoSession(userId: string): Promise<{ token: string; user: any } | null> {
  const existing = inFlightDemoSessions.get(userId);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const res = await fetch('/api/auth/demo-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data?.token && data?.user ? { token: data.token, user: data.user } : null;
    } catch {
      return null;
    } finally {
      inFlightDemoSessions.delete(userId);
    }
  })();

  inFlightDemoSessions.set(userId, promise);
  return promise;
}

/**
 * Attaches the session token to every same-origin /api/ request that does not already carry an
 * Authorization header. Many admin calls were sent without it and failed with 401 after a successful admin login.
 */
export function installAuthFetch(): void {
  const w = window as any;
  if (w.__authFetchInstalled) return;
  w.__authFetchInstalled = true;
  try {
    const descriptor = Object.getOwnPropertyDescriptor(window, 'fetch');
    if (descriptor && !descriptor.writable && !descriptor.configurable) {
      return;
    }
    const original = window.fetch.bind(window);
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      try {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
        const isApi = url.startsWith('/api/') || url.startsWith(window.location.origin + '/api/');
        const token = getAuthToken();
        if (isApi && token) {
          const headers = new Headers(init?.headers || (typeof input === 'object' && 'headers' in (input as any) ? (input as Request).headers : undefined));
          if (!headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${token}`);
            return original(input, { ...init, headers });
          }
        }
      } catch {}
      return original(input, init);
    };
  } catch {}
}
