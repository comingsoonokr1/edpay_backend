import mongoose from "mongoose";
export const connectDB = async () => {
    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI not defined in environment");
    }
    await mongoose.connect(process.env.MONGO_URI, {
    // optional settings
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
    });
    console.log("MongoDB connected");
};
