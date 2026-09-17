import {resolveMaps} from '../lib/google-maps.mjs';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({error: 'Use POST.'});
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (typeof body?.url !== 'string' || body.url.length > 8192) return res.status(400).json({error: 'Paste a valid Google Maps link.'});
    const coordinates = await resolveMaps(body.url);
    return res.status(200).json({coordinates});
  } catch (error) {
    return res.status(400).json({error: error.name === 'TimeoutError' ? 'Google Maps took too long. Try again.' : error.message});
  }
}
