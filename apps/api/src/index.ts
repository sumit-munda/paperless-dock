import express from "express";
import cors from "cors";
import { PACKAGE_NAME } from "@paperless-dock/shared";
import { books } from "./books.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

const PORT = 3000;

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    sharedPackage: PACKAGE_NAME,
  });
});

app.get("/api/books", (_req, res) => {
  res.json({
    books,
  });
});

app.get("/api/books/:bookId", (req, res) => {
  const { bookId } = req.params;

  const book = books.find((item) => item.id === bookId);

  if (!book) {
    return res.status(404).json({
      message: "Book not found",
    });
  }

  res.json({
    book,
  });
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
