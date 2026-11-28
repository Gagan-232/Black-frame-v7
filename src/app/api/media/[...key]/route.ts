import { NextResponse } from 'next/server';
import { presignGet, storageConfigured } from '@/lib/storage';

// Public media only (covers, screenshots, trailers). Game binaries (file/…) are never served here.
export async function GET(_req: Request, { params }: { params: { key: string[] } }) {
  const key = params.key.join('/');
  if (!storageConfigured() || !/^(cover|screenshot|trailer)\/[A-Za-z0-9._-]+$/.test(key)) return new NextResponse('Not found', { status: 404 });
  const url = await presignGet(key, { expiresIn: 3600 });
  return NextResponse.redirect(url, { status: 302, headers: { 'Cache-Control': 'public, max-age=600' } });
}
