// Ugrađuje sadržaj dist/ u modul za Cloudflare Worker (worker/assets.gen.js).
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
};

const root = 'dist';
const files = {};
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else {
      const type = TYPES[extname(p)];
      if (!type) throw new Error(`Nepoznata vrsta datoteke: ${p}`);
      files['/' + relative(root, p).split('\\').join('/')] = { type, body: readFileSync(p).toString('base64') };
    }
  }
};
walk(root);
writeFileSync('worker/assets.gen.js', `export default ${JSON.stringify(files)};\n`);
console.log(`Ugrađeno ${Object.keys(files).length} datoteka.`);
