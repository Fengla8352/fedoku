// Cloudflare Worker koji poslužuje izgrađenu aplikaciju (dist/ ugrađen u assets.gen.js).
import files from './assets.gen.js';

const decoded = new Map();
function body(path) {
  if (!decoded.has(path)) {
    const bin = atob(files[path].body);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    decoded.set(path, bytes);
  }
  return decoded.get(path);
}

function cacheControl(path) {
  // Datoteke s hashom u imenu nikad se ne mijenjaju.
  if (path.startsWith('/assets/')) return 'public, max-age=31536000, immutable';
  // Service worker, index.html i manifest moraju se uvijek provjeriti — inače nova verzija ne stiže.
  return 'no-cache';
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    let path = decodeURIComponent(url.pathname);
    if (path.endsWith('/')) path += 'index.html';
    // Nepoznata putanja bez ekstenzije → aplikacija (SPA).
    if (!files[path] && !/\.[a-z0-9]+$/i.test(path)) path = '/index.html';
    const f = files[path];
    if (!f) return new Response('Not Found', { status: 404 });
    const headers = {
      'Content-Type': f.type,
      'Cache-Control': cacheControl(path),
      'X-Content-Type-Options': 'nosniff',
    };
    if (path === '/sw.js') headers['Service-Worker-Allowed'] = '/';
    return new Response(request.method === 'HEAD' ? null : body(path), { headers });
  },
};
