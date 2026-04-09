import mongoose from "mongoose";
import dotenv from "dotenv";

import { Results, Scanrequests } from "../models/schema.js";
import {
  buildMetadataFromFindings,
  normalizeFindings,
  shouldRefreshMetadata,
} from "../utils/findings-normalizer.js";

dotenv.config();

const MONGO_URI =
  process.env.MONGODB_URL ||
  process.env.MONGO_URL ||
  process.env.MONGODB_URI ||
  "mongodb://localhost:27017/kloudraksha";

const normalizeAllResults = async () => {
  console.log(`[normalize] Connecting to ${MONGO_URI}`);
  await mongoose.connect(MONGO_URI, {
    autoIndex: false,
  });

  let processed = 0;
  let updatedResults = 0;
  let updatedScans = 0;

  const cursor = Results.find().cursor();

  for await (const result of cursor) {
    processed += 1;
    const existingFindings = Array.isArray(result.data) ? result.data : [];
    const { normalized, changed } = normalizeFindings(existingFindings);

    let metadata = result.metadata || {};
    const metadataNeedsRefresh = shouldRefreshMetadata(normalized, metadata);
    if (metadataNeedsRefresh) {
      metadata = buildMetadataFromFindings(normalized, metadata);
    }

    const updatePayload = {};
    if (changed) {
      updatePayload.data = normalized;
    }
    if (metadataNeedsRefresh) {
      updatePayload.metadata = metadata;
    }

    if (Object.keys(updatePayload).length) {
      await Results.updateOne({ _id: result._id }, { $set: updatePayload });
      updatedResults += 1;
    }

    if (metadataNeedsRefresh) {
      const scanUpdate = await Scanrequests.updateOne(
        { audit_id: result.audit_id },
        { $set: { metadata } }
      );
      if (scanUpdate.modifiedCount > 0) {
        updatedScans += 1;
      }
    }

    if (processed % 100 === 0) {
      console.log(
        `[normalize] Processed ${processed} results (updated ${updatedResults}, scan metadata ${updatedScans})`
      );
    }
  }

  console.log(
    `[normalize] Completed. Processed ${processed} results, normalized ${updatedResults}, refreshed ${updatedScans} scan metadata documents.`
  );
  await mongoose.disconnect();
};

normalizeAllResults()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("[normalize] Failed:", err);
    process.exit(1);
  });
