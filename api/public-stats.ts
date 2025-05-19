import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '~/database/db.server';
import { makeShelfError } from '~/utils/error';
import { data, error } from '~/utils/http.server';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const [totalAssets, totalUsers, totalQrCodes] = await Promise.all([
      db.asset.count(),
      db.user.count(),
      db.qr.count(),
    ]);

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=604800");
    res.status(200).json(data({ totalAssets, totalUsers, totalQrCodes }));
  } catch (cause) {
    const reason = makeShelfError(cause);
    res.status(reason.status || 500).json(error(reason));
  }
}