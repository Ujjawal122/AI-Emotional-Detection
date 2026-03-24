import mongoose, { Schema, Document } from "mongoose";

interface Note extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  content: string;
  tags: string[];
  folder?: string;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<Note>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxLength: [200, "Title too long"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      trim: true,
      maxLength: [5000, "Content too long"],
    },
    tags: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
    folder: {
      type: String,
      trim: true,
      default: "root",
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

NoteSchema.index({ user: 1, folder: 1 });
NoteSchema.index({ isPinned: -1, createdAt: -1 });
NoteSchema.index({ createdAt: -1 });

const Note = mongoose.models.Note || mongoose.model<Note>("Note", NoteSchema);

export default Note;
