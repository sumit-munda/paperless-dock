import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { uploadPdf } from "../middleware/uploadPdf.js";
import prisma from "../prisma.js";
import {
  deleteStoredObject,
  uploadBookPdf,
} from "../services/storage.service.js";

const router = Router();

router.get("/dashboard", requireAuth, requireRole("ADMIN"), (req, res) => {
  return res.status(200).json({
    message: "Welcome to the admin dashboard.",
    user: res.locals.user,
  });
});

router.post(
  "/books/:bookId/content",
  requireAuth,
  requireRole("ADMIN"),
  uploadPdf,
  async (req, res, next) => {
    let newObjectKey: string | undefined;

    try {
      const { bookId } = req.params;

      if (typeof bookId !== "string") {
        return res.status(400).json({
          message: "Invalid book ID.",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          message: "Please upload a PDF file.",
        });
      }

      const book = await prisma.book.findUnique({
        where: {
          id: bookId,
        },
        select: {
          id: true,
          contentReference: true,
        },
      });

      if (!book) {
        return res.status(404).json({
          message: "Book not found.",
        });
      }

      try {
        newObjectKey = await uploadBookPdf(book.id, req.file.buffer);
      } catch (error) {
        if (
          error instanceof Error &&
          (error.message === "The uploaded file is not a valid PDF." ||
            error.message === "PDF file is empty.")
        ) {
          return res.status(400).json({
            message: error.message,
          });
        }

        throw error;
      }

      try {
        await prisma.book.update({
          where: {
            id: book.id,
          },
          data: {
            contentReference: newObjectKey,
          },
        });
      } catch (error) {
        try {
          await deleteStoredObject(newObjectKey);
        } catch (cleanupError) {
          console.error("Failed to clean up newly uploaded PDF:", cleanupError);
        }

        throw error;
      }

      const oldObjecKey = book.contentReference;

      if (
        oldObjecKey &&
        oldObjecKey.startsWith(`books/${book.id}/`) &&
        oldObjecKey.endsWith(".pdf")
      ) {
        try {
          await deleteStoredObject(oldObjecKey);
        } catch (error) {
          console.error("Failed to delete previous PDF from R2:", error);
        }
      }

      return res.status(200).json({
        message: "Book PDF uploaded successfully.",
        bookId: book.id,
        contentUploaded: true,
      });
    } catch (error) {
      return next(error);
    }
  },
);

export default router;
