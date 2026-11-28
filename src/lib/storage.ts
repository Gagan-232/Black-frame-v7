import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

const MB = 1024 * 1024, GB = 1024 * MB;
const IMG = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' };
export const UPLOAD_RULES: Record<string, { ext: Record<string, string>; max: number }> = {
  cover: { ext: IMG, max: 10 * MB },
  screenshot: { ext: IMG, max: 10 * MB },
  trailer: { ext: { mp4: 'video/mp4', webm: 'video/webm' }, max: 500 * MB },
  file: { ext: { zip: 'application/zip', '7z': 'application/x-7z-compressed', apk: 'application/vnd.android.package-archive', exe: 'application/vnd.microsoft.portable-executable', msi: 'application/x-msi' }, max: 5 * GB },
};

export const storageConfigured = () => !!(process.env.S3_ENDPOINT && process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY);
let client: S3Client | null = null;
const s3 = () => (client ??= new S3Client({
  region: process.env.S3_REGION || 'auto',
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true,
  credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID!, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY! },
  requestChecksumCalculation: 'WHEN_REQUIRED', // keeps presigned PUTs compatible with R2
  responseChecksumValidation: 'WHEN_REQUIRED',
} as any));
const Bucket = () => process.env.S3_BUCKET!;

export async function presignUpload(kind: string, filename: string, size: number) {
  const rule = UPLOAD_RULES[kind];
  if (!rule) throw new Error('Unknown upload kind');
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const contentType = rule.ext[ext];
  if (!contentType) throw Object.assign(new Error(`Allowed file types for ${kind}: ${Object.keys(rule.ext).join(', ')}`), { status: 400 });
  if (!(size > 0) || size > rule.max) throw Object.assign(new Error(`File too large (max ${Math.round(rule.max / MB)} MB).`), { status: 400 });
  const key = `${kind}/${crypto.randomUUID()}.${ext}`;
  const url = await getSignedUrl(s3(), new PutObjectCommand({ Bucket: Bucket(), Key: key, ContentType: contentType }), { expiresIn: 3600 });
  return { url, key, contentType };
}
export const presignGet = (key: string, opts: { expiresIn?: number; downloadName?: string } = {}) =>
  getSignedUrl(s3(), new GetObjectCommand({ Bucket: Bucket(), Key: key, ...(opts.downloadName ? { ResponseContentDisposition: `attachment; filename="${opts.downloadName.replace(/[^\w.\- ]/g, '_')}"` } : {}) }), { expiresIn: opts.expiresIn ?? 3600 });
export async function headKey(key: string): Promise<{ size: number } | null> {
  try { const r = await s3().send(new HeadObjectCommand({ Bucket: Bucket(), Key: key })); return { size: Number(r.ContentLength ?? 0) }; } catch { return null; }
}
