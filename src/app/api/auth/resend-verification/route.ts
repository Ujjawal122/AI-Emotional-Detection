import { generateVerificationCode } from "@/helpers/generateCode";
import { dbConnect } from "@/lib/dbConnection";
import { sendVerificationEmail } from "@/lib/mailer";
import User from "@/models/User.model";
import { NextResponse,NextRequest } from "next/server";

export async function POST(req:NextRequest) {
    try {
        await dbConnect()
        const{email}=await req.json()
        if(!email){
             return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }
        const user=await User.findOne({email:email.toLowerCase()})
        
 if (!user) {
     
      return NextResponse.json({ error: "User is not found" }, { status: 404 });
    }
     if (user.isVerified) {
      return NextResponse.json({ message: "User already verified" }, { status: 200 });
     }

       if (user.verifyCodeExpiry && user.verifyCodeExpiry > new Date()) {
      return NextResponse.json(
        { error: "Verification code already sent. Please wait." },
        { status: 429 }
      );
    }
    const verifyCode=generateVerificationCode();
    await user.save()
    await sendVerificationEmail(user.email,user.username,verifyCode)
    
    return NextResponse.json({ message: "Verification code resent" }, { status: 200 });


    } catch (error:any) {
         return NextResponse.json(
      { error: "Failed to resend verification code", details: error?.message },
      { status: 500 }
    );
    }
    
}