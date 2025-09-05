export function getCurrentUser(): Record<string, unknown> | null {
  const raw = localStorage.getItem('currentUser');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getCurrentUserId(): string | null {
  const user = getCurrentUser();
  const userId = (user && (user as { user_id?: string }).user_id) || null;
  return userId;
}

export function saveCurrentUser(user: Record<string, unknown>): void {
  localStorage.setItem('currentUser', JSON.stringify(user));
}

export function clearCurrentUser(): void {
  localStorage.removeItem('currentUser');
}

export function isAuthenticated(): boolean {
  return Boolean(getCurrentUserId());
}


