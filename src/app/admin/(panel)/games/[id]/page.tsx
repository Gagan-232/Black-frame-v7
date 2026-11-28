'use client';
import { useParams } from 'next/navigation';
import DataTable, { Field } from '@/components/admin/DataTable';
import { api } from '@/lib/client';

const fileFields: Field[] = [
  { name: 'label', label: 'Label', type: 'text', required: true, help: 'e.g. Windows build' },
  { name: 'platform', label: 'Platform', type: 'select', options: ['Windows', 'Android', 'Other'] },
  { name: 'version', label: 'Version', type: 'text' },
  { name: 'storage_key', label: 'File (zip, 7z, apk, exe, msi)', type: 'file', kind: 'file' },
  { name: 'is_active', label: 'Active (available to download)', type: 'checkbox' },
];
const shotFields: Field[] = [
  { name: 'storage_key', label: 'Screenshot (png, jpg, webp)', type: 'file', kind: 'screenshot' },
  { name: 'caption', label: 'Caption', type: 'text' }, { name: 'sort_order', label: 'Order', type: 'number' },
];
export default function GameMedia() {
  const { id } = useParams<{ id: string }>();
  return (<div className="space-y-12"><h1 className="h1">Files & media</h1>
    <section className="space-y-4"><h2 className="h2">Download files</h2>
      <DataTable endpoint={`/api/admin/games/${id}/files`} fields={fileFields} canCreate canEdit canDelete searchable={false} createLabel="Add file" defaults={{ is_active: true, platform: 'Windows' }}
        columns={[{ key: 'label', label: 'Label' }, { key: 'platform', label: 'Platform' }, { key: 'version', label: 'Version' }, { key: 'size_bytes', label: 'Size (bytes)' }, { key: 'is_active', label: 'Active' }]}
        actions={[{ label: 'Toggle active', run: (r) => api(`/api/admin/games/${id}/files/${r.id}`, { method: 'PATCH', body: { is_active: !r.is_active } }) }]} /></section>
    <section className="space-y-4"><h2 className="h2">Screenshots</h2>
      <DataTable endpoint={`/api/admin/games/${id}/screenshots`} fields={shotFields} canCreate canDelete searchable={false} createLabel="Add screenshot"
        columns={[{ key: 'storage_key', label: 'File' }, { key: 'caption', label: 'Caption' }, { key: 'sort_order', label: 'Order' }]} /></section>
    <p className="text-sm text-mute">Cover and trailer are set from the game’s Edit form.</p></div>);
}
