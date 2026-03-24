import { getCurrentUser } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import File from "@/models/File.model";

// GET - Fetch user's files
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const folder = url.searchParams.get("folder");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");

    const query: { user: mongoose.Types.ObjectId; folder?: string } = {
      user: new mongoose.Types.ObjectId(user._id),
    };

    if (folder && folder !== "root") {
      query.folder = folder;
    }

    const total = await File.countDocuments(query);
    const files = await File.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Get unique folders for sidebar
    const folders = await File.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(user._id) } },
      { $group: { _id: "$folder", count: { $sum: 1 } } },
    ]);

    return NextResponse.json({
      files: files.map((f) => ({
        ...f,
        _id: f._id.toString(),
        user: (f.user as mongoose.Types.ObjectId).toString(),
      })),
      folders: folders.map((f) => ({
        name: f._id || "root",
        count: f.count,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching files:", error);
    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status: 500 }
    );
  }
}

// POST - Upload a new file (metadata only - actual upload handled separately)
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { fileName, originalName, fileSize, mimeType, filePath, folder, tags } = body;

    if (!fileName || !originalName || !filePath || !mimeType) {
      return NextResponse.json(
        { error: "Missing required file fields" },
        { status: 400 }
      );
    }

    const newFile = await File.create({
      user: user._id,
      fileName,
      originalName,
      fileSize: fileSize || 0,
      mimeType,
      filePath,
      folder: folder || "root",
      tags: tags || [],
    });

    return NextResponse.json({
      _id: newFile._id.toString(),
      user: (newFile.user as mongoose.Types.ObjectId).toString(),
      fileName: newFile.fileName,
      originalName: newFile.originalName,
      fileSize: newFile.fileSize,
      mimeType: newFile.mimeType,
      filePath: newFile.filePath,
      folder: newFile.folder,
      tags: newFile.tags,
      createdAt: newFile.createdAt,
      updatedAt: newFile.updatedAt,
    });
  } catch (error) {
    console.error("Error creating file:", error);
    return NextResponse.json(
      { error: "Failed to create file" },
      { status: 500 }
    );
  }
}
