import User from "@/models/User.model";
import { dbConnect } from "@/lib/dbConnection";
import { NextRequest, NextResponse } from "next/server";
import { generateVerificationCode } from "@/helpers/generateCode";
import { sendVerificationEmail } from "@/lib/mailer";

 export async function POST(req:NextRequest) 
{
    try {
      await dbConnect()
        const {username,email,password}=await req.json()
        const alreadyUser=await User.findOne({email})
        if(alreadyUser){
            return NextResponse.json({
                error:"User is already present"
            },{status:404})
        }
        const verifyCode=generateVerificationCode()
       await User.create({
            username,
            email:email.toLowerCase(),
            password,
            isVerified:false,
            verifyCode,
            verifyCodeExpiry:new Date(Date.now()+15*60*1000)
        })

        
        await sendVerificationEmail(email,username,verifyCode)
        return NextResponse.json({
            message:"Signup successfully"
        },{status:201})

        

               
    } catch (error:any) {
            console.log("Registeration failed");
            return NextResponse.json({
                error:"Failed to Signup",
                details:error.message
            },{status:500
            })
            
    }   
}