import { NextRequest,NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnection";
import cloudinary from "@/lib/Cloudiary";
import File from "@/models/File.model";
import upload from "@/lib/multer";
import { parseMultipartForm } from "@/lib/Parsemultipart";
import { getCurrentUser } from "@/lib/auth";
import { resolve } from "path";
import { rejects } from "assert";


export async function POST(req:NextRequest){
    try {
        await dbConnect()
        const user=await getCurrentUser(req)
        if(!user){
            return NextResponse.json({
                error:"Not authenticated"
            },{status:401})
        }
        const {fields,file}=await parseMultipartForm(req,upload)
        if(!file){
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const folder=(fields.folder as string)||"root";
        const tags=fields.tags?(fields.tags as string).split(",").map((t)=>t.trim().toLowerCase()).filter(Boolean):[];

        const cloudinaryResult = await new Promise<{
      resource_type: any;
      public_id:  string;
      secure_url: string;
    }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder:          `emosoul/${user.id}/${folder}`,
          resource_type:   "auto",
          use_filename:    true,
          unique_filename: true,
        },
        (error, result) => {
          if (error || !result) {
            return reject(error ?? new Error("Cloudinary upload failed"));
          }
          resolve({ public_id: result.public_id, secure_url: result.secure_url ,resource_type:result.resource_type});
        }
      );
      stream.end(file.buffer);
    });

      const saved = await File.create({
      user:         user.id,
      fileName:     file.originalname,
      originalName: file.originalname,
      fileSize:     file.size,
      mimeType:     file.mimetype,
      filePath:     cloudinaryResult.secure_url,
      public_id:    cloudinaryResult.public_id,
      resource_type:   cloudinaryResult.resource_type,
      folder,
      tags,
    });
   return NextResponse.json(
      { message: "File uploaded successfully", file: saved },
      { status: 201 }
    );

    } catch (error:any) {
         console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message ?? "Internal server error" },
      { status: 500 }
    );
    }
}