import { getCurrentUser } from "@/lib/auth";
import { NextResponse,NextRequest } from "next/server";
import User from "@/models/User.model";

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
            fullName: user.fullName ?? "",
            email: user.email,
            phone: user.phone ?? "",
            location: user.location ?? "",
            bio: user.bio ?? "",
            isVerified: user.isVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        })
    }catch(error){
        console.log("error",error);
        return NextResponse.json({
            error:"Something Wrong in authentication"
        },{status:500})
        
    }

}

export async function PATCH(req: NextRequest) {
    try {
        const user = await getCurrentUser(req);
        if (!user) {
            return NextResponse.json({ error: "You are not authenticated" }, { status: 401 });
        }

        const body = await req.json();
        const username = typeof body.username === "string" ? body.username.trim() : user.username;
        const fullName = typeof body.fullName === "string" ? body.fullName.trim() : user.fullName ?? "";
        const phone = typeof body.phone === "string" ? body.phone.trim() : user.phone ?? "";
        const location = typeof body.location === "string" ? body.location.trim() : user.location ?? "";
        const bio = typeof body.bio === "string" ? body.bio.trim() : user.bio ?? "";

        if (!username || username.length < 3 || username.length > 30) {
            return NextResponse.json(
                { error: "Username must be between 3 and 30 characters" },
                { status: 400 }
            );
        }

        if (fullName.length > 80 || phone.length > 25 || location.length > 80 || bio.length > 240) {
            return NextResponse.json(
                { error: "One or more fields are longer than allowed" },
                { status: 400 }
            );
        }

        const existingUsername = await User.findOne({
            username,
            _id: { $ne: user._id },
        }).select("_id");

        if (existingUsername) {
            return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
        }

        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            { username, fullName, phone, location, bio },
            { new: true, runValidators: true }
        ).select("_id username fullName email phone location bio isVerified createdAt updatedAt");

        if (!updatedUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            _id: updatedUser._id.toString(),
            username: updatedUser.username,
            fullName: updatedUser.fullName ?? "",
            email: updatedUser.email,
            phone: updatedUser.phone ?? "",
            location: updatedUser.location ?? "",
            bio: updatedUser.bio ?? "",
            isVerified: updatedUser.isVerified,
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt,
        });
    } catch (error) {
        console.log("error", error);
        return NextResponse.json(
            { error: "Failed to update profile" },
            { status: 500 }
        );
    }
}
