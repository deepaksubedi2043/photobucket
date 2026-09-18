import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const JWT_SECRET = process.env.JWT_SECRET || "pb_nepal_jwt_secret_key_2026";

export interface AuthenticatedUserPayload {
  id: string;
  username: string;
  role: string;
  isSuperAdmin?: boolean;
  fullName?: string;
  email?: string;
}

/**
 * Hash plain text password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare plain text password against bcrypt hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate signed JWT token
 */
export function generateToken(payload: AuthenticatedUserPayload, expiresIn: string | number = "7d"): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as any);
}

/**
 * RBAC & Session Verification Middleware
 */
export const authenticateJWT = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Authorization token missing or malformed." });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: "Invalid or expired session token." });
  }
};

/**
 * Admin / Superadmin Authorization Guard
 */
export const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.user || (!req.user.isSuperAdmin && req.user.role !== "admin" && req.user.role !== "super_admin")) {
    return res.status(403).json({ success: false, message: "Forbidden: Superadmin or Admin privileges required." });
  }
  next();
};
