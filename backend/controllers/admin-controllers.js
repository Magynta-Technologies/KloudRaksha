import { Admin } from "../models/schema.js";
import { hash, compare } from "bcrypt";

export const adminignUp = async (req, res,) => {
    try {
        const { email, password } = req.body;
        const hashedPassword = await hash(password, 10);
        const existingUser = await Admin.findOne({ email });

        if (existingUser) {
            return res.status(401).send("not a admin");
        }

        const admin = new Admin({
            email,
            password: hashedPassword,
        });

        await user.save();

        return res
            .status(201)
            .json({ message: "ok", id: admin._id.toString() });
    } catch (error) {
        return res.status(404).json({ message: "error", cause: error.message });
    }
};

export const adminLogin = async (req, res,) => {
    try {
        // User login
        const { email, password } = req.body;
        const admin = await Admin.findOne({
            email,
        });
        if (!user) {
            return res.status(401).send("user not registered");
        }

        const isPasswordCorrect = await compare(password, admin.password);

        if (!isPasswordCorrect) {
            return res.status(403).send("incorrect password");
        }

        return res.status(200).json({ message: "ok", id: admin._id.toString() });
    } catch (error) {
        return res.status(404).json({ message: "error", cause: error.message });
    }
};
