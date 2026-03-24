import { decodeToken, generateToken } from "@/lib/auth";
import { dbConnect } from "@/lib/dbConnection";
import User from "@/models/User.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req:NextRequest) {
    try {
        await dbConnect()
        const {token,newPassword}=await req.json()
        const decode = decodeToken(token)
        if (!decode || typeof decode === "string" || !("userId" in decode)) {
          return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
        }
        const user=await User.findOne({
            _id: (decode as { userId: string }).userId,
            resetPasswordToken:token,
            resetPasswordExpiry:{$gte:Date.now()}
        })
        if(!user){
             return NextResponse.json({
                error:"Invalid or expired token"
            },{status:400})
        }
        user.password=newPassword
        user.resetPasswordToken=null
        user.resetPasswordExpiry=null
        await user.save()

        return NextResponse.json({
            message:"Password reset successful"
        },{status:200})

    } catch (error:any) {
        console.log("Password reset error",error);
        return NextResponse.json({
            error:"Internal server error"
        },{status:500})
    }
    
}