import { dbConnect } from "@/lib/dbConnection";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function GET() {
    try {
    await dbConnect()
    const dbState=mongoose.connection.readyState
    
    return NextResponse.json({
         status: "OK",
      server: "Running",
      database: dbState === 1 ? "Connected" : "Disconnected",
      timestamp: new Date().toISOString(),
    })

    } catch (error) {
         return NextResponse.json(
      {
        status: "ERROR",
        message: "Health check failed",
      },
      { status: 500 }
    );
    }
    
}