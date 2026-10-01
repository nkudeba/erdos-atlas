// The encrypted static build's entry (vite.static.config.ts). static/unlock.html decrypts this bundle and runs it with
// the derived key in window.__ATLAS__; the bundle then fetches and decrypts the snapshot and the live feed. The
// snapshot is never part of this bundle.
import { createRoot } from 'react-dom/client';
import { Atlas, type AtlasSource, type Snapshot } from '@/app/atlas';
import '@/app/globals.css';
import { decryptJson } from './crypto';

type Unlocked = { key: CryptoKey; meta: { data: string; live: string }; lock: () => void };
declare global {
  interface Window { __ATLAS__?: Unlocked }
}

async function fetchEncrypted(url: string, signal?: AbortSignal) {
  const res = await fetch(url, { cache: 'no-store', signal });
  if (!res.ok) throw Error(`${url}: ${res.status}`);
  return res.arrayBuffer();
}

const LOCK = {position: 'fixed', right: 14, bottom: 14, zIndex: 60, fontSize: 12, padding: '6px 10px', borderRadius: 8,
  border: '1px solid rgba(20,35,61,.2)', background: 'rgba(255,255,255,.9)', color: '#14233d', cursor: 'pointer'} as const;

async function main() {
  const ctx = window.__ATLAS__;
  if (!ctx) throw Error('locked');
  const data = await decryptJson<Snapshot>(ctx.key, await fetchEncrypted(ctx.meta.data));
  const source: AtlasSource = {
    data,
    // GitHub Pages caches for ten minutes; the query string asks for the current file.
    loadFeed: async (signal) => decryptJson(ctx.key, await fetchEncrypted(`${ctx.meta.live}?t=${Date.now()}`, signal)),
    pollMs: 60_000,
    // The daemon redeploys at most every 10 minutes and sends a heartbeat every hour, so 75 minutes of silence means
    // the publisher has stopped.
    staleAfterMs: 75 * 60_000,
    refreshLabel: 'about every 10 minutes',
  };
  document.title = 'Erdős Atlas · Harness problem rankings';
  const fonts = document.createElement('link');
  fonts.rel = 'stylesheet';
  fonts.href = 'https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap';
  document.head.appendChild(fonts);
  document.body.className = 'antialiased';
  document.body.style.setProperty('--font-geist-sans', "'Geist', ui-sans-serif, system-ui, sans-serif");
  document.body.style.setProperty('--font-geist-mono', "'Geist Mono', ui-monospace, SFMono-Regular, monospace");
  const root = document.getElementById('root')!;
  root.replaceChildren();
  createRoot(root).render(
    <>
      <Atlas source={source} />
      <button type="button" onClick={ctx.lock} title="Forget the key on this device" style={LOCK}>Lock</button>
    </>,
  );
}

main().catch((e) => {
  const root = document.getElementById('root');
  if (root) root.textContent = `Could not open the site: ${e instanceof Error ? e.message : String(e)}`;
});
