// Decryption for the encrypted static build. Every published file is IV (12 bytes) || AES-256-GCM(gzip(content)),
// keyed by PBKDF2-SHA256 from the passphrase (scripts/publish-static.mjs writes them; static/unlock.html derives the
// key). A wrong key fails GCM authentication, so nothing undecryptable is ever rendered.
export async function decryptBytes(key: CryptoKey, buf: ArrayBuffer): Promise<Uint8Array> {
  const bytes = new Uint8Array(buf);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(0, 12) }, key, bytes.slice(12));
  const stream = new Blob([plain]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function decryptJson<T = unknown>(key: CryptoKey, buf: ArrayBuffer): Promise<T> {
  return JSON.parse(new TextDecoder().decode(await decryptBytes(key, buf))) as T;
}
