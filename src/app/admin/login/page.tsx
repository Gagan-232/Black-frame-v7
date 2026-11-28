import AuthForm from '@/components/AuthForm';
export const metadata = { title: 'Admin login', robots: { index: false } };
export default function AdminLogin() { return <div className="container-x py-16"><AuthForm mode="admin" /></div>; }
