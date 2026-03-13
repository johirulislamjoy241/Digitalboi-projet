import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "digiboi-secret-2025";

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: "30d" });
}

export function verifyToken(token) {
  try { return jwt.verify(token, SECRET); }
  catch { return null; }
}

// Extract auth from request Authorization header
export function getAuth(req) {
  const auth  = req.headers.get("authorization") || "";
  const token = auth.replace("Bearer ", "").trim();
  if (!token) return null;
  return verifyToken(token);
}

export { SECRET };
