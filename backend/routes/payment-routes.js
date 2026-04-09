import { Router } from "express";
import { verifyToken } from "../utils/token-manager.js";
import { orders,paymentVerification} from "../controllers/payment-controllers.js";


const paymentRouter = Router();

paymentRouter.post("/order", verifyToken, orders);
paymentRouter.post("/verify", verifyToken,paymentVerification );



export default paymentRouter;
