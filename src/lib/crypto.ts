import crypto from "crypto";
import { getEnv } from "@/lib/env";

const ALGO = "aes-256-gcm";

function keyBuffer() {
  const env = getEnv();
  return crypto.createHash("sha256").update(env.CONFIG_ENCRYPTION_KEY).digest();
}

export function encryptSecret(plainText: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, keyBuffer(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`;
}

export function decryptSecret(cipherText: string) {
  const [iv, tag, data] = cipherText.split(".");
  const decipher = crypto.createDecipheriv(ALGO, keyBuffer(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(data, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
