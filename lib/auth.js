import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const SECRET = process.env.JWT_SECRET || "digiboi-secret-2025";

export const hashPassword    = (pw)          => bcrypt.hash(pw, 12);
export const comparePassword = (pw, hash)    => bcrypt.compare(pw, hash);
export const signToken       = (payload)     => jwt.sign(payload, SECRET, { expiresIn: "30d" });
export const verifyToken     = (token)       => { try { return jwt.verify(token, SECRET); } catch { return null; } };

export function getAuthUser(req) {
  const auth  = req.headers.get?.("authorization") || req.headers?.authorization || "";
  const token = auth.replace("Bearer ", "").trim();
  if (!token) return null;
  return verifyToken(token);
}

// Alias for backward compatibility
export const getUserFromRequest = getAuthUser;
