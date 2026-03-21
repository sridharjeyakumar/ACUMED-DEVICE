const SESSION_KEY = 'acumed_user';

export interface SessionUser {
  user_id: string;
  employee_id: string;
  role_id?: string;
  active: boolean;
  super_admin: boolean;
  Date_last_login_date?: string;
}

export function getSessionUser(): SessionUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export function setSessionUser(user: SessionUser): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSessionUser(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_KEY);
}

export function isAuthenticated(): boolean {
  return getSessionUser() !== null;
}
