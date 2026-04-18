import crypto from "node:crypto";

const ENCRYPTION_ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

function getKeyBuffer() {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error("Missing ENCRYPTION_KEY environment variable.");
  }

  if (key.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be exactly 32 characters.");
  }

  return Buffer.from(key, "utf8");
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, getKeyBuffer(), iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);

  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decrypt(text: string): string {
  const [ivHex, encryptedHex] = text.split(":");

  if (!ivHex || !encryptedHex) {
    throw new Error("Invalid encrypted payload format.");
  }

  const iv = Buffer.from(ivHex, "hex");

  if (iv.length !== IV_LENGTH) {
    throw new Error("Invalid IV length.");
  }

  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, getKeyBuffer(), iv);
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final()
  ]);

  return decrypted.toString("utf8");
}
