import mongoose, { Schema, Document } from "mongoose";

interface File extends Document {
  user: mongoose.Types.ObjectId;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  filePath: string;
  folder?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const FileSchema = new Schema<File>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },
    fileName: {
      type: String,
      required: [true, "File name is required"],
      trim: true,
    },
    originalName: {
      type: String,
      required: [true, "Original file name is required"],
      trim: true,
    },
    fileSize: {
      type: Number,
      required: [true, "File size is required"],
      min: [0, "File size cannot be negative"],
    },
    mimeType: {
      type: String,
      required: [true, "MIME type is required"],
    },
    filePath: {
      type: String,
      required: [true, "File path is required"],
    },
    folder: {
      type: String,
      trim: true,
      default: "root",
    },
    tags: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
  },
  { timestamps: true }
);

FileSchema.index({ user: 1, folder: 1 });
FileSchema.index({ createdAt: -1 });

const File = mongoose.models.File || mongoose.model<File>("File", FileSchema);

export default File;
