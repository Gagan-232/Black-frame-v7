import { route } from '@/lib/api';
import { dispatch } from '@/lib/admin';
export const dynamic = 'force-dynamic';
const h = route(async (req, { params }) => dispatch(req, params.path));
export const GET = h, POST = h, PATCH = h, PUT = h, DELETE = h;
