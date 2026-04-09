import express from "express";
import { config } from "dotenv";
config();
import cors from "cors";
import morgan from "morgan";
import appRouter from "./routes/index.js";
import cookieParser from "cookie-parser";
import cron from "node-cron";
import { User } from "./models/schema.js";
import { fileURLToPath } from "url";
import path from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app = express();
app.set("trust proxy", 1);

const allowedOrigins ="http://localhost:4173,http://localhost:5173,https://kloudraksha.com,https://www.kloudraksha.com,https://kloudraksha.oneam.app,http://kloudraksha.oneam.app,https://www.kloudraksha.oneam.app,http://www.kloudraksha.oneam.app"
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  try {
    const { hostname } = new URL(origin);
    return hostname === "kloudraksha.com" || hostname.endsWith(".kloudraksha.com");
  } catch (err) {
    return false;
  }
};

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(morgan("dev"));
app.use(helmet());
app.use(helmet.hidePoweredBy());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'uploads')));


// cron.schedule('* * * * *', async () => {
//     console.log('Running a scheduled task to update subscriptions');

//     try {
//         const now = new Date();
//         await User.updateMany(
//             { 'subscription.current_period_end': { $lte: now }, 'subscription.status': 'active' },
//             { $set: { 'subscription.status': 'inactive' } }
//         );
//         console.log('Subscription statuses updated');
//     } catch (error) {
//         console.error('Error updating subscription statuses', error);
//     }
// });


app.use("/api", appRouter);

export default app;
