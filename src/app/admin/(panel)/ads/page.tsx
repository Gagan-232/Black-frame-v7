'use client';
import DataTable, { Field } from '@/components/admin/DataTable';
import { api } from '@/lib/client';
const fields: Field[] = [
  { name: 'name', label: 'Name', type: 'text', required: true }, { name: 'placement', label: 'Placement', type: 'select', options: ['content', 'banner'], help: 'content = mid-page, banner = bottom of page' },
  { name: 'ad_key', label: 'Ad key (32 hex characters)', type: 'text', required: true }, { name: 'width', label: 'Width (px)', type: 'number', required: true }, { name: 'height', label: 'Height (px)', type: 'number', required: true },
  { name: 'script_url', label: 'Script URL (https)', type: 'text', required: true }, { name: 'is_active', label: 'Active', type: 'checkbox' },
];
export default function AdsAdmin() {
  return (<div className="space-y-6"><h1 className="h1">Advertisements</h1>
    <p className="text-sm text-mute">Ads load inside sandboxed frames and are hidden for ad-free accounts. Turn all ads on/off under Settings.</p>
    <DataTable endpoint="/api/admin/ads" fields={fields} canCreate canEdit canDelete searchable={false} createLabel="Add ad unit" defaults={{ is_active: true, width: 300, height: 250 }}
      columns={[{ key: 'name', label: 'Name' }, { key: 'placement', label: 'Placement' }, { key: 'width', label: 'W' }, { key: 'height', label: 'H' }, { key: 'ad_key', label: 'Key' }, { key: 'is_active', label: 'Active' }]}
      actions={[{ label: 'Toggle', run: (r) => api(`/api/admin/ads/${r.id}`, { method: 'PATCH', body: { is_active: !r.is_active } }) }]} /></div>);
}
