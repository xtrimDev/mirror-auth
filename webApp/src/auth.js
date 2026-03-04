import { cookies } from "next/headers";
import crypto from "crypto";
import jwt from "jsonwebtoken";

function decryptAuthToken(encryptedToken) {
  if (!encryptedToken || typeof encryptedToken !== "string") return null;

  const parts = encryptedToken.split(":");
  if (parts.length !== 2) return null;

  const [ivHex, cipherHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const ciphertext = Buffer.from(cipherHex, "hex");

  if (!process.env.AES_SECRET_KEY) return null;
  const key = crypto
    .createHash("sha256")
    .update(process.env.AES_SECRET_KEY)
    .digest();

  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(ciphertext, undefined, "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export function getUserFromEncryptedToken(encryptedToken) {
  try {
    if (!encryptedToken) return null;

    const jwtToken = decryptAuthToken(encryptedToken);
    if (!jwtToken || !process.env.JWT_SECRET_KEY) {
      return null;
    }

    const payload = jwt.verify(jwtToken, process.env.JWT_SECRET_KEY);

    return {
      userId: payload?.userId ?? null,
      fullName: payload?.fullName ?? null,
      email: payload?.email ?? null,
      mobileNumber: payload?.mobileNumber ?? null,
    };
  } catch {
    return null;
  }
}

export async function getAuthenticatedUser() {
  const tokenCookie = (await cookies()).get("authToken")?.value;
  return getUserFromEncryptedToken(tokenCookie);
}

