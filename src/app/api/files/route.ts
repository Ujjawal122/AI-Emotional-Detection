import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { dbConnect } from "@/lib/dbConnection";
import File from "@/models/File.model";

// GET /api/files — fetch all files for the logged-in user
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await dbConnect();

    // Query uses "user" field — matches your schema
    const files = await File
      .find({ user: user.id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ files }, { status: 200 });
  } catch (error: any) {
    console.error("Get files error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}