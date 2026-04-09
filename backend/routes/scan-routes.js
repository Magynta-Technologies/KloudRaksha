import { Router } from "express";
import {
  getScanResults,
  getUserScanRequests,
  getAlladminScanRequests,
  updateStatusandFile,  // Make sure this is exported from controller!
  downloadfile,
  deleteRequest,
  limitScanReq,
  scanRequestAutomate,
  scanRequestComplete,
  updateStatus,
  getScanOverview,
  populateMetadata,
  scanRequest,
  getRawReportLink,
} from "../controllers/scan-controllers.js";

import { verifyToken } from "../utils/token-manager.js";
import { upload } from "../middleware/multer.js";

const scanRouter = Router();

scanRouter.post("/scanrequest", verifyToken, limitScanReq, scanRequestAutomate);
scanRouter.get("/usr", verifyToken, getUserScanRequests);
scanRouter.get("/scanresult/:id", verifyToken, getScanResults);
scanRouter.get("/admin/scanresult/:id", verifyToken, getScanResults);
scanRouter.get("/getallrequest", getAlladminScanRequests);
scanRouter.post("/scanRequestComplete", scanRequestComplete);
scanRouter.post(
  "/scanRequests/:id/upload",
  upload.single("file"),
  updateStatusandFile
);
scanRouter.put("/scanRequests/:id/update", updateStatus);
scanRouter.get("/downloadfile/:id", downloadfile);
scanRouter.delete("/deleterequest/:id", deleteRequest);
scanRouter.get("/overview", verifyToken, getScanOverview);
scanRouter.post("/populate-metadata", verifyToken, populateMetadata);
scanRouter.get("/scanresult/overview/:id", verifyToken, getScanOverview);
scanRouter.get("/scanRequests/:id/raw-report", verifyToken, getRawReportLink);

export default scanRouter;
