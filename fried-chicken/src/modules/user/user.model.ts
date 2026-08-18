// UserModel — exported Mongoose model

// src/modules/user/user.model
import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface UserFields {
    name: string;
    username: string;
    email: string;
    passwordHash: string;
    profileImage: string;
    isVerified: boolean;
    createdAt: Date;
}

export interface UserDocument extends UserFields, Document {}

const userSchema = new Schema<UserDocument>({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50,
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        minlength: 3,
        maxlength: 20,
    },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    profileImage: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

export const UserModel: Model<UserDocument> = mongoose.model<UserDocument>("User", userSchema);

export function toPublicUser(user: UserDocument) {
    const obj = user.toObject<UserFields & { _id: unknown }>();
    return {
        id: String(obj._id),
        name: obj.name,
        username: obj.username,
        email: obj.email,
        isEmailVerified: obj.isVerified,
        profilePhotoUrl: obj.profileImage || undefined,
    };
}

export default UserModel;
