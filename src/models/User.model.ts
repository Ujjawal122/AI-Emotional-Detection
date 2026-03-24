
import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";

const genSalt = (rounds: number) =>
  new Promise<string>((resolve, reject) => {
    bcrypt.genSalt(rounds, (err, salt) => {
      if (err) return reject(err);
      resolve(salt);
    });
  });

const hashPassword = (password: string, salt: string) =>
  new Promise<string>((resolve, reject) => {
    bcrypt.hash(password, salt, (err, hashed) => {
      if (err) return reject(err);
      resolve(hashed);
    });
  });

const comparePasswordHash = (password: string, hashed: string) =>
  new Promise<boolean>((resolve, reject) => {
    bcrypt.compare(password, hashed, (err, isMatch) => {
      if (err) return reject(err);
      resolve(isMatch);
    });
  });

interface User extends Document {
  username: string;
  password: string;
  email: string;
  moods: mongoose.Types.ObjectId[];
  isVerified: boolean;
  verifyCode: string | null;
  verifyCodeExpiry: Date | null;
  resetPasswordToken: string | null;
  resetPasswordExpiry: number | null;
  comparePassword(userPassword: string): Promise<boolean>;
}
const UserSchema = new Schema<User>({
  username: {
    type: String,
    required: [true, "Username is required"],
    trim: true,
    unique: true,
    minlength: [3, "Username too short"],
    maxlength: [30, "Username too long"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password too short"],
    select: false,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Invalid email"],
  },
  moods: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mood",
    },
  ],
  isVerified: {
    type: Boolean,
    default: false,
  },
  verifyCode: {
    type: String,
    default: null,
  },
  verifyCodeExpiry: {
    type: Date,
    default: null,
  },
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpiry: {
    type: Number,
    default: null,
  },
});




UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await genSalt(10);
  this.password = await hashPassword(this.password, salt);
});


UserSchema.methods.comparePassword = async function (userPassword: string) {
  return await comparePasswordHash(userPassword, this.password);
};

UserSchema.virtual("fullname").get(function (this: User) {
  return `${this.username}`;
});

UserSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete (user as any).password;
  delete (user as any).verifyCode;
  delete (user as any).resetPasswordToken;
  return user;
};

const User =
  (mongoose.models.User as mongoose.Model<User>) ||
  mongoose.model<User>("User", UserSchema);

export default User;