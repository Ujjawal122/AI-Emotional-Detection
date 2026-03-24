import { NextResponse,NextRequest } from "next/server";

export async function POST(req:NextRequest) {
    try{
        const response=NextResponse.json({
            message:"Logout Successfully"
        },{status:200
        })
        response.cookies.set("token"," ",{
            httpOnly:true,
            secure:process.env.NODE_ENV==="production",
            expires:new Date(0),
            maxAge:0,
            sameSite:"lax"
        })
        return response
    }catch(error:any){
        console.log("logout error: ",error.message);
        return NextResponse.json({
            error:"logout failed"
        },{status:500
        })
    }
    
}