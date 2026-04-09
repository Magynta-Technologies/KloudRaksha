import { connect, disconnect } from "mongoose";

async function connectToDatabase() {
    try {
        await connect(process.env.MONGODB_URL);
        console.log("connected to db");
    } catch (error) {
        throw new Error("cannot connect to DB");
    }
}

async function disconnectFromDatabase() {
    try {
        await disconnect();
    } catch (error) {
        throw new Error("cannot disconnect db");
    }
}

export { connectToDatabase, disconnectFromDatabase };
