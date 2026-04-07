import { getCurrentUser } from "@/lib/auth";
import { NextResponse,NextRequest } from "next/server";

export async function GET(req:NextRequest) {
    try{
        const user=await getCurrentUser(req)
        if(!user){
            return NextResponse.json({
                error:"You are not authenticated"
            },{status:401
            })
            
        }
        return NextResponse.json({
            _id: user._id.toString(),
            username: user.username,
            email: user.email,
            isVerified: user.isVerified,
        })
    }catch(error){
        console.log("error",error);
        return NextResponse.json({
            error:"Something Wrong in authentication"
        },{status:500})
        
    }

}
