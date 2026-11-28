'use client';
import DataTable from '@/components/admin/DataTable';
export default function DownloadsAdmin() {
  return (<div className="space-y-6"><h1 className="h1">Download log</h1><p className="text-sm text-mute">Files are managed per game under Games → Files & media.</p>
    <DataTable endpoint="/api/admin/downloads" empty="No downloads recorded yet." columns={[{ key: 'username', label: 'User' }, { key: 'game', label: 'Game' }, { key: 'file', label: 'File' }, { key: 'created_at', label: 'When' }]} /></div>);
}
