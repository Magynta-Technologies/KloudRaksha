import { Router } from "express";
import { getAllUsers, userLogin, usersignUp, verifyUser, userLogout, setUserAdmin, setUserSuperAdmin, deleteuser } from "../controllers/user-controllers.js";
import { loginValidator, signupValidator, validate } from '../utils/validators.js';
import { verifyToken } from "../utils/token-manager.js";

const userRouter = Router();

userRouter.get('/allusers', getAllUsers);
userRouter.post('/signup', validate(signupValidator), usersignUp);
// add during prod
// userRouter.post('/login', validate(loginValidator), userLogin);
userRouter.post('/login', userLogin);
userRouter.get('/auth-status', verifyToken, verifyUser);
userRouter.get('/logout', verifyToken, userLogout);
userRouter.delete('/deleteuser/:id', deleteuser);
userRouter.get('/setAdmin', verifyToken, setUserAdmin);
userRouter.get('/setSuperAdmin', verifyToken, setUserSuperAdmin);

export default userRouter;
