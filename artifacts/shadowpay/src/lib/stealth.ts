import { Keypair } from "@solana/web3.js";

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error("Invalid hex");
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

export function generateSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return bytesToHex(bytes);
}

export async function deriveStealthKeypair(
  secretHex: string,
  linkId: string
): Promise<Keypair> {
  const secretBytes = hexToBytes(secretHex);
  const linkIdBytes = new TextEncoder().encode(linkId);
  const combined = new Uint8Array(secretBytes.length + linkIdBytes.length);
  combined.set(secretBytes);
  combined.set(linkIdBytes, secretBytes.length);
  const hashBuffer = await crypto.subtle.digest("SHA-256", combined);
  const seed = new Uint8Array(hashBuffer);
  return Keypair.fromSeed(seed);
}

export function encodePrivateKey(keypair: Keypair): string {
  return bytesToHex(keypair.secretKey);
}
