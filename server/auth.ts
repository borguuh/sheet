import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
const JWT_EXPIRES_IN = "7d";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export function generateToken(userId: string, email: string, role: string = "admin"): string {
  return jwt.sign(
    { userId, email, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token: string): { userId: string; email: string; role: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role || "admin"
    };
  } catch (error) {
    return null;
  }
}

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ message: "Access token required" });
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(403).json({ message: "Invalid or expired token" });
    return;
  }

  // Verify user still exists
  const user = await storage.getUserById(decoded.userId);
  if (!user) {
    res.status(403).json({ message: "User not found" });
    return;
  }

  req.user = {
    id: decoded.userId,
    email: decoded.email,
    role: decoded.role
  };

  next();
}

// Simple password comparison (plaintext as requested)
export function comparePasswords(plaintext: string, stored: string): boolean {
  return plaintext === stored;
}

// Hash password (just return plaintext as requested)
export function hashPassword(password: string): string {
  return password; // Using plaintext as requested
}