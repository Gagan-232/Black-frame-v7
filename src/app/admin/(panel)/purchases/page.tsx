'use client';
import DataTable from '@/components/admin/DataTable';
import { api, money } from '@/lib/client';
const set = (id: number, status: string) => api(`/api/admin/purchases/${id}`, { method: 'PATCH', body: { status } });
export default function PurchasesAdmin() {
  return (<div className="space-y-6"><h1 className="h1">Purchases</h1>
    <p className="text-sm text-mute">No payment gateway is connected, so no purchases are created automatically. Status changes (super admin only) are for manual record-keeping and are audit-logged.</p>
    <DataTable endpoint="/api/admin/purchases" searchable={false} filters={[{ name: 'status', label: 'Status', options: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'] }]} empty="No purchases recorded."
      columns={[{ key: 'username', label: 'User' }, { key: 'game', label: 'Game' }, { key: 'amount_paise', label: 'Amount', render: (r) => money(r.amount_paise) }, { key: 'status', label: 'Status' }, { key: 'provider', label: 'Provider' }, { key: 'created_at', label: 'Created' }]}
      actions={[{ label: 'Mark paid', confirm: 'Mark as PAID and grant ad-free?', show: (r) => r.status !== 'PAID', run: (r) => set(r.id, 'PAID') }, { label: 'Refunded', confirm: 'Mark as refunded?', show: (r) => r.status === 'PAID', run: (r) => set(r.id, 'REFUNDED') }]} /></div>);
}
