import { dbConnect } from "@/lib/dbConnection";
import User from "@/models/User.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req:NextRequest) {
    try {
        await dbConnect();
        const{email,code}=await req.json();
        const user =await User.findOne({email})
        if(!user){
            return NextResponse.json({
                error:"User is not found"
            },{status:401})
        }
        if(user.isVerified){
            return NextResponse.json({
                error:"User is already verified"
            },{status:200})
        }
        if(user.verifyCode!==code){
            return NextResponse.json({
                error:"Invalid Verification Code"
            })
        }
        if(user.verifyCodeExpiry&&user.verifyCodeExpiry<new Date()){
            return NextResponse.json({error:"Verification is expired"},{status:400})

        }
        user.isVerified=true;
        user.verifyCode=null;
        user.verifyCodeExpiry=null
        await user.save()
        return NextResponse.json({
            message:"User verification is successfull"

        },{status:200})
    } catch (error:any) 
    {
      return NextResponse.json({error:error.message||"Internal server error"},{status:500})  
    }
    
}