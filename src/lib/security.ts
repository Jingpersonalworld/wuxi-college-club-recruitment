import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function code(length: number): string {
  const bytes = randomBytes(length);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

export function createTrackingNumber(): string { return `TD-${code(10)}`; }
export function createQueryCode(): string { return code(12); }
export function hashQueryCode(value: string): string { return createHash("sha256").update(value.toUpperCase()).digest("hex"); }
export function verifyQueryCode(value: string, hash: string): boolean {
  if (!/^[a-f0-9]{64}$/.test(hash)) return false;
  return timingSafeEqual(Buffer.from(hashQueryCode(value), "hex"), Buffer.from(hash, "hex"));
}

export function csvCell(value: unknown): string {
  let text = String(value ?? "");
  if (/^[\s]*[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
