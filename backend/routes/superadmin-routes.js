import express from "express";
import { Router } from "express";
// import { protect, restrictTo } from "../middleware/authMiddleware.js";
import superadminControllers from "../controllers/superadmin-controllers.js";
const superadminRouter = Router();

// Protect all routes
// router.use(protect);
// router.use(restrictTo("superadmin"));

// Dashboard routes
superadminRouter.get(
  "/dashboard-overview",
  superadminControllers.getDashboardOverview
);
superadminRouter.get(
  "/user-management",
  superadminControllers.getUserManagementData
);
superadminRouter.get("/platform-logs", superadminControllers.getLogData);
superadminRouter.get("/audit-report", superadminControllers.getAuditReportData);

// User role management
superadminRouter.patch(
  "/update-user-role/:userId",
  superadminControllers.updateUserRole
);

export default superadminRouter;
