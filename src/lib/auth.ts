import jwt, { type JwtPayload } from "jsonwebtoken";
import type { NextRequest } from "next/server";
import { dbConnect } from "@/lib/dbConnection";
import User from "@/models/User.model";

const JWT_KEY = process.env.JWT_KEY_PASS;

if (!JWT_KEY) {
  throw new Error("JWT_KEY_PASS is not set");
}

const getTokenFromRequest = (req: NextRequest): string | null => {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length);
  }

  const cookieToken = req.cookies.get("token")?.value;
  return cookieToken ?? null;
};

export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_KEY, { expiresIn: "1h" });
};

export const verifyToken = (token: string): JwtPayload | string => {
  return jwt.verify(token, JWT_KEY) as JwtPayload | string;
};

export const decodeToken = (token: string): JwtPayload | string | null => {
  return jwt.decode(token) as JwtPayload | string | null;
};

export const getCurrentUser = async (req: NextRequest) => {
  const token = getTokenFromRequest(req);
  if (!token) return null;

  const decoded = verifyToken(token);
  if (typeof decoded === "string") return null;

  const userId = (decoded as JwtPayload).userId as string | undefined;
  if (!userId) return null;

  await dbConnect();
  return await User.findById(userId).select(
    "_id username fullName email phone location bio isVerified createdAt updatedAt"
  );
};
