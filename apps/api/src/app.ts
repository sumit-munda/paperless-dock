import express from "express";
import cors from "cors";
import { PACKAGE_NAME } from "@paperless-dock/shared";
import prisma from "./prisma.js";
import sessionMiddleware from "./session.js";
import authRouter from "./routes/auth.routes.js";
import adminRouter from "./routes/admin.routes.js";
import usersRouter from "./routes/users.routes.js";
import cartRouter from "./routes/cart.routes.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());

app.use(sessionMiddleware);

app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/users", usersRouter);
app.use("/api/cart", cartRouter);

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    sharedPackage: PACKAGE_NAME,
  });
});

app.get("/api/books", async (_req, res) => {
  const databaseBooks = await prisma.book.findMany({
    where: {
      status: "PUBLISHED",
    },

    include: {
      authors: {
        include: {
          author: true,
        },
      },
      categories: {
        include: {
          category: true,
        },
      },
    },

    orderBy: {
      title: "asc",
    },
  });

  const books = databaseBooks.map((book) => ({
    id: book.id,
    title: book.title,
    author: book.authors.map((item) => item.author.name).join(", "),
    category: book.categories.map((item) => item.category.name).join(", "),
    description: book.description,
    price: Number(book.price),
    coverImage: book.coverImage ?? "",
    rating: book.rating,
  }));

  res.json({
    books,
  });
});

app.get("/api/books/:bookId", async (req, res) => {
  const { bookId } = req.params;

  const databaseBook = await prisma.book.findFirst({
    where: {
      id: bookId,
      status: "PUBLISHED",
    },
    include: {
      authors: {
        include: {
          author: true,
        },
      },
      categories: {
        include: {
          category: true,
        },
      },
    },
  });

  if (!databaseBook) {
    return res.status(404).json({
      message: "Book not found",
    });
  }

  const book = {
    id: databaseBook.id,
    title: databaseBook.title,
    author: databaseBook.authors.map((item) => item.author.name).join(", "),
    category: databaseBook.categories
      .map((item) => item.category.name)
      .join(", "),
    description: databaseBook.description,
    price: Number(databaseBook.price),
    coverImage: databaseBook.coverImage ?? "",
    rating: databaseBook.rating,
  };

  return res.json({
    book,
  });
});

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("API error:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  },
);

export default app;
