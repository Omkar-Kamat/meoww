import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
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
    refreshTokenHash: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
export default User;
