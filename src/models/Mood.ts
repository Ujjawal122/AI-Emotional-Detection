import { kMaxLength } from "buffer"
import mongoose, { Schema, Model, Document } from "mongoose"

interface Mood extends Document{

  user:mongoose.Types.ObjectId;
  text:string;
  sentiment:string;
  intensity:number;
  aiQuestion:string[];
  triggers:string[];
  location:string;
  weather:string;
  embedding:number[];
  tags:string[];
  createdAt:Date;
  updatedAt:Date;

  isRecent(hours?:number):boolean;
  getMoodStats(userId:mongoose.Types.ObjectId, days?:number):Promise<{_id:string,count:number,avgIntensity:number}[]>
  durationMinutes:number;

}


const MoodSchema=new Schema<Mood,Model<Mood>>(
    {
        user:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:[true,"User is required"],
            index:true

        },
        text:{
            type:String,
            required:[true,"Mood entry text is required"],
            trim:true,
            maxLength:[200,"Entry too Long"]
        },
        sentiment:{
            type:String,
            enum: {
        values: ["happy", "low", "neutral", "stressed", "anxious", "excited", "angry", "sad"],
        message: "Invalid sentiment"
        },
        required:[true,"Intensity rating required"]
    },
    aiQuestion:[{
        type:String,
        trim:true,
        maxLength:[500,"AI question too long"]
    }],
    triggers: [{
      type: String,
      enum: ["work", "family", "health", "social", "weather", "other"],
      default: ["other"]
    }],
    location:{
        type:String,
        trim: true,
      maxlength: [100, "Location too long"]
    },

    weather: {
      type: String,
      enum: ["sunny", "rainy", "cloudy", "snowy", "stormy"],
      sparse: true  
    },
    embedding: [Number],  
    tags: [{
      type: String,
      lowercase: true,
      trim: true
    }]
},
 {timestamps: true}

)


MoodSchema.index({user:1,createdAt:-1})
MoodSchema.index({sentiment:1,createdAt:-1})
MoodSchema.index({"trigger":1})
MoodSchema.index({createdAt:-1})

MoodSchema.methods.isRecent=function(hours=24){
    const now=new Date()
    const cutoff=new Date(now.getTime()-(hours*60*60*1000))
    return this.createdAt>cutoff
}

MoodSchema.statics.getMoodStats = async function(userId, days = 30) {
  const cutoff = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
  return await this.aggregate([
    { $match: { user: userId, createdAt: { $gte: cutoff } } },
    {
      $group: {
        _id: "$sentiment",
        count: { $sum: 1 },
        avgIntensity: { $avg: "$intensity" }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

MoodSchema.virtual("durationMinutes").get(function() {
  return 0;  
});

export default mongoose.models.Mood||mongoose.model("Mood",MoodSchema)
