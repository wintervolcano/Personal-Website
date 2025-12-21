// api/gallery-likes.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const ids = String(req.query.ids || '').split(',').filter(Boolean);
    const likes = await kv.mget<number[]>(...ids.map(id => `gallery:likes:${id}`));
    res.json(ids.map((id, i) => ({ id, likes: likes?.[i] || 0 })));
    return;
  }
  const id = String(req.query.id || req.url!.split('/').pop());
  const key = `gallery:likes:${id}`;
  if (req.method === 'POST') {
    const v = await kv.incr(key);
    res.json({ id, likes: v });
  } else if (req.method === 'DELETE') {
    const v = await kv.decr(key);
    res.json({ id, likes: Math.max(0, v) });
  } else {
    res.status(405).end();
  }
}
