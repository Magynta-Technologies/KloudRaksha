import { Router } from "express";
import userRouter from "./user-routes.js";
import scanRouter from "./scan-routes.js";
import paymentRouter from "./payment-routes.js";
import superadminRouter from "./superadmin-routes.js";
const appRouter = Router();

appRouter.use("/user", userRouter);
appRouter.use("/scan", scanRouter);
appRouter.use("/payment", paymentRouter);
appRouter.use("/superadmin", superadminRouter);

export default appRouter;
