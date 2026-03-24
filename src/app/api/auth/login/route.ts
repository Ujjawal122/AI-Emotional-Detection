import { dbConnect } from "@/lib/dbConnection";
import { NextRequest, NextResponse } from "next/server";
import User from "@/models/User.model";
import { generateToken } from "@/lib/auth";

export async function POST(req:NextRequest) {
    try {
        await dbConnect()
        const {email,password}=await req.json()
        if(!email||!password){
             return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
        }

        // `password` has `select: false` in the schema, so we must explicitly include it for bcrypt compare.
        const user = await User.findOne({ email: email.toLowerCase() }).select("+password")
        if(!user){
            return NextResponse.json({
                error:"User is not Found Signup first"
            },{status:401})
        }
        const isMatch =await user.comparePassword(password);

        if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if(!user.isVerified){
        return NextResponse.json(
        { error: "Please verify your email first" },
        { status: 403 }
      );
    }

   const token=generateToken(user._id.toString())
   const response = NextResponse.json(
    { message: "Login successfully" },
    { status: 200 }
   );
   response.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60, // 1 hour
    path: "/",
   });
   return response;
    } catch (error:any) {
        return NextResponse.json({
            error:"Failed to Login",
            details:error.message
        },{status:500})
    }
}