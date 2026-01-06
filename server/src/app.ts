import express from "express";
import "dotenv/config";
import { notFound } from "./middlewares/notFound.js";
import { errorMiddleware } from "./middlewares/errorMiddleware.js";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import connectToDB from "./config/db.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/v1/auth", authRoutes);

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
    console.log(`Server is running on PORT http://localhost:${PORT}`)
  );
};

startServer();
