import express from "express";
import "dotenv/config";
import { notFound } from "./middlewares/notFound.js";
import { errorMiddleware } from "./middlewares/errorMiddleware.js";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import connectToDB from "./config/db.js";
import cors from "cors";
import morgan from "morgan";

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = ["http://localhost:5173"];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

console.log("🔥 CORS CONFIG LOADED FROM AUTH BRANCH");

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/profile", profileRoutes);

app.use("/api/v1", (req, res) => {
  res.send("API v1 Testing...");
});

// 404
app.use(notFound);

// Central error handler (LAST)
app.use(errorMiddleware);

const startServer = () => {
  connectToDB();
  app.listen(PORT, () =>
    console.log(`Server is running on PORT http://localhost:${PORT}`),
  );
};

startServer();
