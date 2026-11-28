import { q1 } from '@/lib/db';
export const dynamic = 'force-dynamic';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// Ads are rendered in their own document, embedded via a sandboxed iframe WITHOUT allow-same-origin,
// so ad scripts cannot read site cookies, storage or DOM. Only structured, validated fields are used.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) return new Response('Not found', { status: 404 });
  const ad = await q1(`SELECT ad_key, width, height, script_url FROM advertisements WHERE id = $1 AND is_active`, [id]);
  if (!ad) return new Response('Not found', { status: 404 });
  const opts = JSON.stringify({ key: ad.ad_key, format: 'iframe', height: ad.height, width: ad.width, params: {} }).replace(/</g, '\\u003c');
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:transparent"><script>var atOptions=${opts};</script><script src="${esc(ad.script_url)}"></script></body></html>`;
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline' https:; img-src https: data:; style-src 'unsafe-inline' https:; frame-src https:; connect-src https:; media-src https:; font-src https:; frame-ancestors 'self'",
      'Referrer-Policy': 'no-referrer',
      'Cache-Control': 'no-store',
    },
  });
}
