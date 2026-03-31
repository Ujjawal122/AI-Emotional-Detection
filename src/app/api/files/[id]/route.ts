import { NextResponse,NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { dbConnect } from "@/lib/dbConnection";
import cloudinary from "@/lib/Cloudiary";
import File from "@/models/File.model";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

   
    const { id } = await params;

    const file = await File.findOne({ _id: id, user: user.id }).lean();

    if (!file) {
      return NextResponse.json({ error: "File not Found" }, { status: 404 });
    }

    return NextResponse.json({ file }, { status: 200 });
  } catch (error) {
    console.error("Get file error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    
    const { id } = await params;

    const file = await File.findOne({ _id: id, user: user.id });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    await cloudinary.uploader.destroy(file.filename, {
      resource_type: "auto",
    });

    await File.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "File deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete file error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
