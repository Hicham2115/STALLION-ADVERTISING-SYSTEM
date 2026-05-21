/** App home route (dashboard for managers; team members may be redirected by role guards). */
export const DASHBOARD_PATH = '/';

export const AUTH_METHOD_KEY = 'stallion_auth_method';

export type AuthMethod = 'clerk' | 'email';

export function setAuthMethod(method: AuthMethod): void {
  localStorage.setItem(AUTH_METHOD_KEY, method);
}

export function clearAuthMethod(): void {
  localStorage.removeItem(AUTH_METHOD_KEY);
}

export function getStoredAuthMethod(): AuthMethod | null {
  const v = localStorage.getItem(AUTH_METHOD_KEY);
  return v === 'clerk' || v === 'email' ? v : null;
}
