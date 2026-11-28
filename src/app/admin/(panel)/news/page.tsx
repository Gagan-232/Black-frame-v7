'use client';
import DataTable, { Field } from '@/components/admin/DataTable';
import { api } from '@/lib/client';
const fields: Field[] = [
  { name: 'title', label: 'Title', type: 'text', required: true }, { name: 'slug', label: 'Slug (URL)', type: 'text', required: true },
  { name: 'body', label: 'Body (plain text)', type: 'textarea', required: true }, { name: 'is_published', label: 'Published', type: 'checkbox' },
];
export default function NewsAdmin() {
  return (<div className="space-y-6"><h1 className="h1">News</h1>
    <DataTable endpoint="/api/admin/news" fields={fields} canCreate canDelete createLabel="New post" empty="No posts yet."
      columns={[{ key: 'title', label: 'Title' }, { key: 'slug', label: 'Slug' }, { key: 'is_published', label: 'Published' }, { key: 'published_at', label: 'Published at' }]}
      actions={[{ label: 'Toggle publish', run: (r) => api(`/api/admin/news/${r.id}`, { method: 'PATCH', body: { is_published: !r.is_published } }) }]} /></div>);
}
