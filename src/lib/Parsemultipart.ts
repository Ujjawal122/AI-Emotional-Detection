import { NextRequest } from "next/server";
import { Readable } from "stream";
import multer from "multer";
import type { Request, Response } from "express";


export async function parseMultipartForm(
  req: NextRequest,
  multerMiddleware: multer.Multer
): Promise<{ fields: Record<string, string>; file: Express.Multer.File | null }> {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    throw new Error("Request is not multipart/form-data");
  }

  // Read body into a Buffer
  const buf = Buffer.from(await req.arrayBuffer());

  // Build a minimal Node IncomingMessage from the buffer
  const readable = Readable.from(buf) as unknown as Request;
  readable.headers = Object.fromEntries(req.headers.entries());
  readable.method  = req.method;

  // Fake Express response (multer only needs a minimal object)
  const fakeRes = {
    setHeader: () => {},
    end:       () => {},
    getHeader: () => "",
  } as unknown as Response;

  return new Promise((resolve, reject) => {
    multerMiddleware.single("file")(readable, fakeRes, (err) => {
      if (err) return reject(err);

      const file   = (readable as any).file   ?? null;
      const body   = (readable as any).body   ?? {};
      resolve({ fields: body, file });
    });
  });
}