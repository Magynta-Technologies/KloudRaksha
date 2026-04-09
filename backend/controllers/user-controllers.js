import {  User } from "../models/schema.js";
import { hash, compare } from "bcrypt";
import { createToken } from "../utils/token-manager.js";
import { COOKIE_NAME } from "../utils/constants.js";
import { logEvent } from "./log-controller.js";
import { AuditActionType } from "../models/schema.js";


export const getAllUsers = async (req, res, next) => {
    try {
        // Get all users
        const users = await User.find();
        return res.status(200).json({ message: "ok", users });
    } catch (error) {
        return res.status(404).json({ message: "error", cause: error.message });
    }
};

const isProduction = process.env.NODE_ENV === "production";
const baseCookieOptions = {
    path: "/",
    httpOnly: true,
    sameSite: isProduction ? "strict" : "lax",
    secure: isProduction,
};

export const usersignUp = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });


        if (existingUser) {
            return res.status(401).send("user already registered");
        }

        const hashedPassword = await hash(password, 12);

        const user = new User({
            name,
            email,
            password: hashedPassword,
        });

        await user.save();

        // Create token and store cookies
        res.clearCookie(COOKIE_NAME, baseCookieOptions);

        const token = createToken(user._id.toString(), user.email, "7d");
        const expires = new Date();
        expires.setDate(expires.getDate() + 7);

        res.cookie(COOKIE_NAME, token, { ...baseCookieOptions, expires });

        return res.status(201).json({ message: "ok", id: user._id.toString() });
    } catch (error) {
        return res.status(404).json({ message: "error", cause: error.message });
    }
};

export const userLogin = async (req, res, next) => {
    try {
        // User login
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            return res.status(401).send("user not registered");
        }

        const suppliedPassword = password || "";
        const storedPassword = user.password || "";

        let isPasswordCorrect = false;
        const isBcryptHash = storedPassword.startsWith("$2");

        if (isBcryptHash) {
            isPasswordCorrect = await compare(suppliedPassword, storedPassword);
        } else if (storedPassword) {
            // Support legacy accounts that may still store plain text passwords
            isPasswordCorrect = suppliedPassword === storedPassword;

            if (isPasswordCorrect) {
                try {
                    const rehashedPassword = await hash(storedPassword, 12);
                    await User.findByIdAndUpdate(user._id, { password: rehashedPassword });
                } catch (rehashError) {
                    console.error("Failed to rehash legacy password", rehashError);
                }
            }
        }

        if (!isPasswordCorrect) {
            return res.status(403).send("incorrect password");
        }

        res.clearCookie(COOKIE_NAME, baseCookieOptions);

        const token = createToken(user._id.toString(), user.email, "7d");
        const expires = new Date();
        expires.setDate(expires.getDate() + 7);

        res.cookie(COOKIE_NAME, token, { ...baseCookieOptions, expires });

        await logEvent(user._id, AuditActionType.LOGIN, "Passed");

        return res.status(200).json({ message: "ok", id: user._id.toString() });
    } catch (error) {
        return res.status(404).json({ message: "error", cause: error.message });
    }
};

export const verifyUser = async (req, res, next) => {
    try {
        // User token check
        const user = await User.findById(res.locals.jwtData.id);

        if (!user) {
            return res
                .status(401)
                .send("User not registered OR Token malfunctioned");
        }

        if (user._id.toString() !== res.locals.jwtData.id) {
            return res.status(401).send("Permissions didn't match");
        }

        return res
            .status(200)
            .json({ message: "OK" ,name: user.name, email: user.email,role:user.role,subscription:user.subscription});
    } catch (error) {
        resolve();
        console.log(error);
        return res.status(404).json({ message: "ERROR", cause: error.message });
    }
};

export const userLogout = async (req, res, next) => {
    try {
        // User token check
        const user = await User.findById(res.locals.jwtData.id);

        if (!user) {
            return res
                .status(401)
                .send("User not registered OR Token malfunctioned");
        }

        if (user._id.toString() !== res.locals.jwtData.id) {
            return res.status(401).send("Permissions didn't match");
        }

        res.clearCookie(COOKIE_NAME, baseCookieOptions);

        await logEvent(user._id, AuditActionType.LOGOUT, "Passed");

        return res
            .status(200)
            .json({ message: "OK", name: user.name, email: user.email });
    } catch (error) {
        console.log(error);
        return res.status(404).json({ message: "ERROR", cause: error.message });
    }
};

export const setUserAdmin = async (req, res, next) => {
    try {
        // User token check
        const user = await User.findById(res.locals.jwtData.id);
        const userId = res.locals.jwtData.id;

        if (!user) {
            return res
                .status(401)
                .send("User not registered OR Token malfunctioned");
        }

        if (user._id.toString() !== res.locals.jwtData.id) {
            return res.status(401).send("Permissions didn't match");
        }

        if (user) {
            await User.findByIdAndUpdate(userId,{role:'admin'});
        }

        await logEvent(
            user._id,
            AuditActionType.ROLE_CHANGE,
            "Passed",
            { details: { newRole: 'admin' } }
        );

        return res
            .status(200)
            .json({ message: "OK", name: user.name, email: user.email });
    } catch (error) {
        resolve();
        console.log(error);
        return res.status(404).json({ message: "ERROR", cause: error.message });
    }
};
export const setUserSuperAdmin = async (req, res, next) => {
    try {
        // User token check
        const user = await User.findById(res.locals.jwtData.id);
        const userId = res.locals.jwtData.id;

        if (!user) {
            return res
                .status(401)
                .send("User not registered OR Token malfunctioned");
        }

        if (user._id.toString() !== res.locals.jwtData.id) {
            return res.status(401).send("Permissions didn't match");
        }
        if (user) {
            await User.findByIdAndUpdate(userId,{role:'superadmin'});
        }

        await logEvent(
            user._id,
            AuditActionType.ROLE_CHANGE,
            "Passed",
            { details: { newRole: 'superadmin' } }
        );

        return res
            .status(200)
            .json({ message: "OK", name: user.name, email: user.email });
    } catch (error) {
        resolve();
        console.log(error);
        return res.status(404).json({ message: "ERROR", cause: error.message });
    }
};

export const deleteuser =async(req,res)=>{
    try {
        const { id } = req.params;
        const deletedUser = await User.findByIdAndDelete(id);
        if (!deletedUser) {
            return res.status(404).json({ message: "User not found" });
        }
        await logEvent(
            req.user._id, // assuming req.user is set
            AuditActionType.USER_MANAGEMENT,
            "Passed",
            { details: { action: 'delete', targetUserId: id } }
        );
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting user" });
    }
}
