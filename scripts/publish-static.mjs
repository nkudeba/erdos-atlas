#!/usr/bin/env node
// Encrypt the static build for GitHub Pages. Every content file becomes IV (12 bytes) || AES-256-GCM(gzip(content)),
// keyed by PBKDF2-SHA256(passphrase, salt). Only static/unlock.html (generic, no content), meta.json (salt,
// iteration count, a check value, file names), the KaTeX fonts, robots.txt and .nojekyll are public in plaintext.
// The passphrase is read from a file and never printed. Usage (atlas_pages.py runs it):
//   node scripts/publish-static.mjs --out DIR --passphrase-file F --salt B64 --iterations N --data app/data.json \
//     --feed FEED.json --app-dir dist-static --fonts public/fonts --unlock static/unlock.html [--deployed-at ISO]
import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createCipheriv, createHash, pbkdf2Sync, randomBytes } from 'node:crypto';
import { gzipSync } from 'node:zlib';

const args = {};
for (let i = 2; i < process.argv.length; i += 2) args[process.argv[i].replace(/^--/, '')] = process.argv[i + 1];
for (const k of ['out', 'passphrase-file', 'salt', 'iterations', 'data', 'feed', 'app-dir', 'fonts', 'unlock'])
  if (!args[k]) throw Error(`missing --${k}`);

const passphrase = readFileSync(args['passphrase-file'], 'utf8').trim();
if (passphrase.length < 20) throw Error('passphrase too short (need at least 20 characters)');
const salt = Buffer.from(args.salt, 'base64');
const iterations = Number(args.iterations);
if (salt.length < 16 || !Number.isInteger(iterations) || iterations < 100_000) throw Error('weak key derivation settings');
const key = pbkdf2Sync(passphrase, salt, iterations, 32, 'sha256');

const seal = (plain) => {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const body = Buffer.concat([cipher.update(gzipSync(plain, { level: 9 })), cipher.final(), cipher.getAuthTag()]);
  return Buffer.concat([iv, body]);
};
const tag = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 12);

const out = args.out;
mkdirSync(out, { recursive: true });
for (const name of readdirSync(out)) if (name !== '.git') rmSync(join(out, name), { recursive: true, force: true });

// KaTeX's stylesheet asks for /fonts/...; under a Pages project path that must be relative to the page.
const css = readFileSync(join(args['app-dir'], 'app.css'), 'utf8').replaceAll('url(/fonts/', 'url(fonts/');
const js = readFileSync(join(args['app-dir'], 'app.js'), 'utf8');
const files = {
  'app.enc': seal(Buffer.from(JSON.stringify({ js, css }))),
  'data.enc': seal(readFileSync(args.data)),
  'live.enc': seal(readFileSync(args.feed)),
};
for (const [name, buf] of Object.entries(files)) writeFileSync(join(out, name), buf);

mkdirSync(join(out, 'fonts'));
for (const f of readdirSync(args.fonts)) if (f.endsWith('.woff2')) copyFileSync(join(args.fonts, f), join(out, 'fonts', f));
copyFileSync(args.unlock, join(out, 'index.html'));
writeFileSync(join(out, '.nojekyll'), '');
writeFileSync(join(out, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
const meta = {
  v: 1,
  kdf: { name: 'PBKDF2-SHA256', iterations, salt: salt.toString('base64') },
  check: seal(Buffer.from('erdos-atlas')).toString('base64'),
  app: `app.enc?v=${tag(files['app.enc'])}`,
  data: `data.enc?v=${tag(files['data.enc'])}`,
  live: 'live.enc',
  deployedAt: args['deployed-at'] || new Date().toISOString(),
};
writeFileSync(join(out, 'meta.json'), JSON.stringify(meta, null, 1) + '\n');
console.log(JSON.stringify({ ok: true, bytes: Object.fromEntries(Object.entries(files).map(([k, v]) => [k, v.length])) }));
