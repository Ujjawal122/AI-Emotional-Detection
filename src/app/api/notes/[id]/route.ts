import { getCurrentUser } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Note from "@/models/Note.model";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type LeanNote = {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  title: string;
  content: string;
  folder?: string;
  tags: string[];
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function toNoteJson(note: LeanNote) {
  return {
    ...note,
    _id: note._id.toString(),
    user: (note.user as mongoose.Types.ObjectId).toString(),
  };
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid note id" }, { status: 400 });
    }

    const note = await Note.findOne({
      _id: new mongoose.Types.ObjectId(id),
      user: new mongoose.Types.ObjectId(user._id),
    }).lean();

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json(toNoteJson(note));
  } catch (error) {
    console.error("Error fetching note:", error);
    return NextResponse.json({ error: "Failed to fetch note" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid note id" }, { status: 400 });
    }

    const body = await req.json();
    const updates: Record<string, unknown> = {};

    if (typeof body?.title === "string") updates.title = body.title.trim();
    if (typeof body?.content === "string") updates.content = body.content.trim();
    if (typeof body?.folder === "string") updates.folder = body.folder.trim() || "root";
    if (typeof body?.isPinned === "boolean") updates.isPinned = body.isPinned;
    if (Array.isArray(body?.tags)) {
      updates.tags = body.tags
        .filter((tag: unknown): tag is string => typeof tag === "string")
        .map((tag: string) => tag.trim().toLowerCase())
        .filter(Boolean);
    }

    if ("title" in updates && !updates.title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if ("content" in updates && !updates.content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const note = await Note.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        user: new mongoose.Types.ObjectId(user._id),
      },
      updates,
      { new: true, runValidators: true, lean: true }
    );

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json(toNoteJson(note));
  } catch (error) {
    console.error("Error updating note:", error);
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid note id" }, { status: 400 });
    }

    const deleted = await Note.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      user: new mongoose.Types.ObjectId(user._id),
    }).lean();

    if (!deleted) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
