'use client';
import DataTable from '@/components/admin/DataTable';
import { api } from '@/lib/client';
const patch = (id: number, body: any) => api(`/api/admin/users/${id}`, { method: 'PATCH', body });
export default function UsersAdmin() {
  const locked = (r: any) => r.role === 'SUPER_ADMIN';
  return (<div className="space-y-6"><h1 className="h1">Users</h1>
    <DataTable endpoint="/api/admin/users" filters={[{ name: 'status', label: 'Status', options: ['ACTIVE', 'SUSPENDED', 'BANNED'] }, { name: 'role', label: 'Role', options: ['USER', 'ADMIN', 'SUPER_ADMIN'] }]}
      columns={[{ key: 'username', label: 'Username' }, { key: 'role', label: 'Role' }, { key: 'status', label: 'Status' }, { key: 'ad_free', label: 'Ad-free' }, { key: 'active_sessions', label: 'Sessions' }, { key: 'preregs', label: 'Pre-regs' }, { key: 'downloads', label: 'Downloads' }, { key: 'created_at', label: 'Joined' }, { key: 'last_login_at', label: 'Last login' }]}
      actions={[
        { label: 'Suspend', confirm: 'Suspend this account and sign it out everywhere?', show: (r) => !locked(r) && r.status === 'ACTIVE', run: (r) => patch(r.id, { status: 'SUSPENDED' }) },
        { label: 'Ban', danger: true, confirm: 'Ban this account and sign it out everywhere?', show: (r) => !locked(r) && r.status !== 'BANNED', run: (r) => patch(r.id, { status: 'BANNED' }) },
        { label: 'Reactivate', show: (r) => !locked(r) && r.status !== 'ACTIVE', run: (r) => patch(r.id, { status: 'ACTIVE' }) },
        { label: 'Revoke sessions', confirm: 'Sign this user out of all devices?', show: (r) => !locked(r), run: (r) => api(`/api/admin/users/${r.id}/revoke-sessions`, { method: 'POST', body: {} }) },
        { label: 'Toggle ad-free', show: (r) => !locked(r), run: (r) => patch(r.id, { ad_free: !r.ad_free }) },
        { label: 'Make admin', confirm: 'Grant administrator access? (super admin only)', show: (r) => r.role === 'USER', run: (r) => patch(r.id, { role: 'ADMIN' }) },
        { label: 'Remove admin', confirm: 'Remove administrator access?', show: (r) => r.role === 'ADMIN', run: (r) => patch(r.id, { role: 'USER' }) },
      ]} /></div>);
}
