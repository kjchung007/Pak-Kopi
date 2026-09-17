export function mapsLink(value) {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    const host = url.hostname.toLowerCase();
    const google = /^(www\.|maps\.)?google\.(com|com\.my|co\.uk)$/.test(host);
    if (host === 'maps.app.goo.gl' || (host === 'goo.gl' && url.pathname.startsWith('/maps')) ||
        (google && (host.startsWith('maps.') || url.pathname.startsWith('/maps')))) return value.trim();
  } catch { /* Invalid or incomplete input. */ }
  return null;
}

export function coordinatesFromMaps(value) {
  let decoded = value;
  try { decoded = decodeURIComponent(value); } catch { /* Keep original. */ }
  // A place's coordinates take precedence over the map camera (@lat,lng).
  const place = decoded.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  let pair = place && [place[1], place[2]];
  if (!pair) {
    try {
      const url = new URL(value);
      for (const name of ['query', 'q']) {
        const match = url.searchParams.get(name)?.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
        if (match) { pair = [match[1], match[2]]; break; }
      }
    } catch { /* No coordinate query. */ }
  }
  if (!pair) return null;
  const [latitude, longitude] = pair.map(Number);
  return Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180
    ? {latitude, longitude} : null;
}

export async function resolveMaps(value, fetcher = fetch) {
  if (!mapsLink(value)) throw new Error('Paste an HTTPS Google Maps share link or place URL.');
  let url = value.trim();
  for (let hop = 0; hop < 6; hop++) {
    const coordinates = coordinatesFromMaps(url);
    if (coordinates) return coordinates;
    // Only expand share links; do not scrape Google place pages.
    if (!['maps.app.goo.gl', 'goo.gl'].includes(new URL(url).hostname)) break;
    const response = await fetcher(url, {redirect: 'manual', signal: AbortSignal.timeout(8000)});
    await response.body?.cancel();
    const location = response.headers.get('location');
    if (response.status < 300 || response.status >= 400 || !location) break;
    const next = new URL(location, url).href;
    if (!mapsLink(next)) throw new Error('Google returned an unsupported redirect. Use the full Google Maps place URL.');
    url = next;
  }
  return null;
}
