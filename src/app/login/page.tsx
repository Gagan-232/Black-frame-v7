import AuthForm from '@/components/AuthForm';
export const metadata = { title: 'Login' };
export default function Login({ searchParams }: { searchParams: { next?: string } }) { return <div className="container-x py-16"><AuthForm mode="login" next={searchParams.next} /></div>; }
