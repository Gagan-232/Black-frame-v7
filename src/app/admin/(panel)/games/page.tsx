'use client';
import DataTable, { Field } from '@/components/admin/DataTable';
import { money } from '@/lib/client';

const fields: Field[] = [
  { name: 'title', label: 'Title', type: 'text', required: true },
  { name: 'slug', label: 'Slug (URL)', type: 'text', required: true, help: 'e.g. night-shift' },
  { name: 'tagline', label: 'Tagline', type: 'text' },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'status', label: 'Development status', type: 'select', options: ['COMING_SOON', 'IN_DEVELOPMENT', 'RELEASED'] },
  { name: 'version', label: 'Version', type: 'text' },
  { name: 'release_info', label: 'Release info', type: 'text' },
  { name: 'system_requirements', label: 'System requirements', type: 'textarea' },
  { name: 'price_paise', label: 'Ad-free price (in paise)', type: 'number', help: '₹59 = 5900. Leave empty for none.' },
  { name: 'cover_key', label: 'Cover image', type: 'file', kind: 'cover' },
  { name: 'trailer_key', label: 'Trailer video', type: 'file', kind: 'trailer' },
  { name: 'is_published', label: 'Published (visible to the public)', type: 'checkbox' },
  { name: 'prereg_open', label: 'Pre-registration open', type: 'checkbox' },
];
export default function GamesAdmin() {
  return (<div className="space-y-6"><h1 className="h1">Games</h1>
    <DataTable endpoint="/api/admin/games" fields={fields} canCreate canEdit canDelete createLabel="Add game"
      filters={[{ name: 'status', label: 'Status', options: ['COMING_SOON', 'IN_DEVELOPMENT', 'RELEASED'] }]}
      columns={[{ key: 'title', label: 'Title' }, { key: 'status', label: 'Status' }, { key: 'is_published', label: 'Published' }, { key: 'prereg_open', label: 'Pre-reg open' }, { key: 'prereg_count', label: 'Pre-regs' }, { key: 'price_paise', label: 'Price', render: (r) => money(r.price_paise) || '—' }]}
      actions={[{ label: 'Files & media', href: (r) => `/admin/games/${r.id}` }]} /></div>);
}
