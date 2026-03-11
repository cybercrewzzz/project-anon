import nacl from 'tweetnacl';
import {
  encodeBase64,
  decodeBase64,
  encodeUTF8,
  decodeUTF8,
} from 'tweetnacl-util';
import { getRandomBytes } from 'expo-crypto';

export interface KeyPair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

/**
 * Generate an X25519 key pair for Diffie-Hellman key exchange.
 * Each chat session should generate a fresh ephemeral key pair.
 *
 * Uses expo-crypto for randomness instead of nacl.box.keyPair() directly,
 * because tweetnacl's internal PRNG (randombytes) is not available in the
 * React Native/Hermes environment. nacl.box.keyPair.fromSecretKey() is
 * deterministic given the secret key, so no PRNG is needed after this point.
 */
export function generateKeyPair(): KeyPair {
  const secretKey = getRandomBytes(32);
  return nacl.box.keyPair.fromSecretKey(secretKey);
}

/**
 * Derive a shared secret from our secret key and their public key.
 * Uses X25519 Diffie-Hellman. Returns a 32-byte shared key
 * for symmetric encryption.
 */
export function deriveSharedSecret(
  mySecretKey: Uint8Array,
  theirPublicKey: Uint8Array,
): Uint8Array {
  return nacl.box.before(theirPublicKey, mySecretKey);
}

/**
 * Encrypt a plaintext string using XSalsa20-Poly1305 (nacl.secretbox).
 * Returns a base64 string: base64( nonce[24] || ciphertext )
 */
export function encrypt(plaintext: string, sharedSecret: Uint8Array): string {
  const nonce = getRandomBytes(nacl.secretbox.nonceLength);
  const messageBytes = decodeUTF8(plaintext);
  const ciphertext = nacl.secretbox(messageBytes, nonce, sharedSecret);

  const combined = new Uint8Array(nonce.length + ciphertext.length);
  combined.set(nonce);
  combined.set(ciphertext, nonce.length);

  return encodeBase64(combined);
}

/**
 * Decrypt a base64 payload back to plaintext.
 * Returns null if decryption fails (tampered data or wrong key).
 */
export function decrypt(
  encryptedPayload: string,
  sharedSecret: Uint8Array,
): string | null {
  const combined = decodeBase64(encryptedPayload);
  const nonce = combined.slice(0, nacl.secretbox.nonceLength);
  const ciphertext = combined.slice(nacl.secretbox.nonceLength);

  const plaintext = nacl.secretbox.open(ciphertext, nonce, sharedSecret);
  if (!plaintext) return null;

  return encodeUTF8(plaintext);
}

/**
 * Restore a key pair from a previously saved secret key (base64).
 * Use this after loading the secret key from expo-secure-store.
 */
export function keyPairFromSecretKey(secretKeyB64: string): KeyPair {
  return nacl.box.keyPair.fromSecretKey(base64ToBytes(secretKeyB64));
}

export function bytesToBase64(bytes: Uint8Array): string {
  return encodeBase64(bytes);
}

export function base64ToBytes(b64: string): Uint8Array {
  return decodeBase64(b64);
}
