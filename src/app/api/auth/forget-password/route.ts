import { generateToken } from "@/lib/auth";
import { dbConnect } from "@/lib/dbConnection";
import User from "@/models/User.model";
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer"

export async function POST(req:NextRequest) {
    try{
        await dbConnect()
        const{email}=await req.json()
        const user=await User.findOne({email})

        if(!user){
            return NextResponse.json({error:"User is not found"},{status:401})

        }
        const resetToken=generateToken(user.id as string)

        user.resetPasswordToken=resetToken
        user.resetPasswordExpiry=Date.now()+15*60*1000
        await user.save()

         const transporter=nodemailer.createTransport({
            service:"gmail",
            auth:{
                user:process.env.SMTP_USER,
                pass:process.env.SMTP_PASS
            }
        })

       const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/resetpassword?token=${resetToken}`;

        await transporter.sendMail({
      from: `"Support" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Password Reset Request",
      html: `
        <p>You requested a password reset.</p>
        <p>Click the link below to reset your password (valid for 15 minutes):</p>
        <a href="${resetUrl}">${resetUrl}</a>
      `,
    });
    
    return NextResponse.json({
        message:"Reset Link sent to email"
    },{status:200})

    } catch (error:any) {
        console.log("forget password error",error);
        return NextResponse.json({
            error:"Internal server error"
        },{status:500})
        
    }
    

}
    
