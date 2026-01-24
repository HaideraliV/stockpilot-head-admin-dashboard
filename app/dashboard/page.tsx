import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AUTH_COOKIE, isAuthed } from '../../lib/auth';
import DashboardPageClient from './page.client';

export default function DashboardRoute() {
  const store = cookies();
  const authed = isAuthed(store.get(AUTH_COOKIE)?.value);
  if (!authed) {
    redirect('/login');
  }
  return <DashboardPageClient />;
}
