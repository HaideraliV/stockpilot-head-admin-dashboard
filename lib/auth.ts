export const AUTH_COOKIE = 'sp_head_admin';

export function isAuthed(cookieValue: string | undefined) {
  return cookieValue === '1';
}
