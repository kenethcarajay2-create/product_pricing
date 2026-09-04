import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const connection = await mongoose.connect(
            process.env.MONGODB_URI
        );

        console.log("MongoDB connected successfully");
        console.log(
            "Host:",
            connection.connection.host
        );
        console.log(
            "Database:",
            connection.connection.name
        );

        const collections =
            await connection.connection.db
                .listCollections()
                .toArray();

        console.log(
            "Collections:",
            collections.map(
                (collection) => collection.name
            )
        );
    } catch (error) {
        console.error(
            "MongoDB connection failed:",
            error.message
        );

        process.exit(1);
    }
};

export default connectDB;