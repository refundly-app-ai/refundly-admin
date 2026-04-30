async function importKey() {
  const rawKey = Buffer.from(process.env.TOTP_ENCRYPTION_KEY!, 'base64');
  return crypto.subtle.importKey('raw', rawKey, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function encryptSecret(plaintext: string): Promise<string> {
  const key = await importKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  const result = new Uint8Array(iv.length + ciphertext.byteLength);
  result.set(iv);
  result.set(new Uint8Array(ciphertext), iv.length);
  return Buffer.from(result).toString('base64');
}

export async function decryptSecret(encryptedBase64: string): Promise<string> {
  const key = await importKey();
  const data = Buffer.from(encryptedBase64, 'base64');
  const iv = data.subarray(0, 12);
  const ciphertext = data.subarray(12);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new TextDecoder().decode(plaintext);
}
