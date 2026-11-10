import express from "express";
import cors from "cors";
import { PACKAGE_NAME } from "@paperless-dock/shared";
import prisma from "./prisma.js";
import { csrfSynchronisedProtection, invalidCsrfTokenError } from "./csrf.js";
import sessionMiddleware from "./session.js";
import authRouter from "./routes/auth.routes.js";
import adminRouter from "./routes/admin.routes.js";
import usersRouter from "./routes/users.routes.js";
import cartRouter from "./routes/cart.routes.js";
import checkoutRouter from "./routes/checkout.routes.js";
import ordersRouter from "./routes/orders.routes.js";
import libraryRouter from "./routes/library.routes.js";
import razorpayWebhooksRouter from "./routes/razorpay-webhooks.routes.js";

const app = express();
app.set("trust proxy", 1);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    exposedHeaders: ["Accept-Ranges", "Content-Range", "Content-Length"],
  }),
);

// Razorpay webhook must receive the untouched raw request body.
// This must be mounted before express.json().
app.use(
  "/api/webhooks/razorpay",
  express.raw({ type: "application/json" }),
  razorpayWebhooksRouter,
);

app.use(express.json());

app.use(sessionMiddleware);
app.use(csrfSynchronisedProtection);

app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/users", usersRouter);
app.use("/api/cart", cartRouter);
app.use("/api/checkout", checkoutRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/library", libraryRouter);

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

    if (error === invalidCsrfTokenError) {
      return res.status(403).json({
        message: "Invalid or missing CSRF token.",
      });
    }

    res.status(500).json({
      message: "Internal server error",
    });
  },
);

export default app;
