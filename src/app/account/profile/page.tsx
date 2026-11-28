import { q1 } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { fmtDate } from '@/lib/format';
export const metadata = { title: 'Profile' };
export default async function Profile() {
  const s = (await getSessionUser())!;
  const u = await q1(`SELECT username, role, ad_free, created_at, last_login_at FROM users WHERE id = $1`, [s.id]);
  return (
    <div className="card max-w-xl"><h1 className="h2 mb-6">Profile</h1>
      <dl className="grid grid-cols-2 gap-y-3 text-sm"><dt className="text-mute">Username</dt><dd>{u.username}</dd><dt className="text-mute">Member since</dt><dd>{fmtDate(u.created_at)}</dd>
        <dt className="text-mute">Last login</dt><dd>{fmtDate(u.last_login_at)}</dd><dt className="text-mute">Ad-free</dt><dd>{u.ad_free ? 'Yes' : 'No'}</dd>
        {u.role !== 'USER' && <><dt className="text-mute">Role</dt><dd>{u.role}</dd></>}</dl></div>
  );
}
