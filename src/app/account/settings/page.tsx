import { getSessionUser } from '@/lib/auth';
import SettingsPanel from '@/components/SettingsPanel';
export const metadata = { title: 'Settings' };
export default async function Settings() {
  const u = (await getSessionUser())!;
  return <SettingsPanel forced={u.must_change_password} admin={u.role !== 'USER'} />;
}
