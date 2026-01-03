import express from "express";
import "dotenv/config";
import { notFound } from "./middlewares/notFound.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use("/v1", (req, res) => {
  res.send("API v1 Testing...");
});

app.get("/", (req, res) => {
  res.send("API Testing...");
});

// 404
app.use(notFound);

// Central error handler (LAST)
app.use(errorHandler);

const startServer = () => {
  app.listen(PORT, () =>
    console.log(`Server is running on PORT http://localhost:${PORT}`)
  );
};

startServer();
