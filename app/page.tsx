import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AUTH_COOKIE, isAuthed } from '../lib/auth';

export default function HomePage() {
  const store = cookies();
  const authed = isAuthed(store.get(AUTH_COOKIE)?.value);
  if (authed) {
    redirect('/dashboard');
  }
  redirect('/login');
}
