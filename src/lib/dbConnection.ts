import mongoose from "mongoose";

let isConnected=false

export const dbConnect =async()=>{
    if(isConnected)return;
    const MONGODB_URL=process.env.DATABASE_URL

    if(!MONGODB_URL){
        throw new Error("MONGODB_URL is missing...")  
        
    }

    try {
        const db=await mongoose.connect(MONGODB_URL)
            isConnected=db.connections[0].readyState===1
            console.log("Mongodb Connected");
            
    } catch (error) {
        console.log("Mongodb Connection Problem");

        
    }


}