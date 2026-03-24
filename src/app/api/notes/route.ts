import { getCurrentUser } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Note from "@/models/Note.model";

// GET - Fetch user's notes
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

    const total = await Note.countDocuments(query);
    const notes = await Note.find(query)
      .sort({ isPinned: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      notes: notes.map((n) => ({
        ...n,
        _id: n._id.toString(),
        user: (n.user as mongoose.Types.ObjectId).toString(),
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}

// POST - Create a new note
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, content, folder, tags, isPinned } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const newNote = await Note.create({
      user: user._id,
      title,
      content,
      folder: folder || "root",
      tags: tags || [],
      isPinned: isPinned || false,
    });

    return NextResponse.json({
      _id: newNote._id.toString(),
      user: (newNote.user as mongoose.Types.ObjectId).toString(),
      title: newNote.title,
      content: newNote.content,
      folder: newNote.folder,
      tags: newNote.tags,
      isPinned: newNote.isPinned,
      createdAt: newNote.createdAt,
      updatedAt: newNote.updatedAt,
    });
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    );
  }
}
