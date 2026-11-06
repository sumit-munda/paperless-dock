import { Router } from "express";

import { pipeline } from "node:stream/promises";

import { S3ServiceException } from "@aws-sdk/client-s3";

import prisma from "../prisma.js";

import { requireAuth } from "../middleware/requireAuth.js";

import { getUserLibrary } from "../services/library.service.js";

import { getStoredPdf, getStoredPdfSize } from "../services/storage.service.js";

const router = Router();

router.use(requireAuth);

function isValidRangeHeader(range: string): boolean {
  // Only one byte range is supported.
  // Supported formats: bytes=0-99, bytes=100-, bytes=-500.
  return /^bytes=(\d+-\d*|-\d+)$/.test(range);
}

function isInvalidRangeError(error: unknown): boolean {
  if (!(error instanceof S3ServiceException)) {
    return false;
  }

  return (
    error.name === "InvalidRange" || error.$metadata.httpStatusCode === 416
  );
}

// Get the authenticated user's library.
router.get("/", async (_req, res, next) => {
  try {
    const library = await getUserLibrary(res.locals.user.id);

    return res.status(200).json({
      library,
      count: library.length,
    });
  } catch (error) {
    return next(error);
  }
});

// Securely stream a purchased book's PDF.
router.get("/:bookId/content", async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const userId = res.locals.user.id;

    // Verify that the authenticated user owns this book.
    const libraryItem = await prisma.libraryItem.findUnique({
      where: {
        userId_bookId: {
          userId,
          bookId,
        },
      },

      select: {
        book: {
          select: {
            id: true,
            contentReference: true,
          },
        },
      },
    });

    // Do not disclose whether another user's book exists.
    if (!libraryItem) {
      return res.status(404).json({
        message: "Book not found in your library.",
      });
    }

    const objectKey = libraryItem.book.contentReference;

    if (!objectKey) {
      return res.status(404).json({
        message: "Book content is not available.",
      });
    }

    // Ensure the object belongs to the requested book.
    if (
      !objectKey.startsWith(`books/${bookId}/`) ||
      !objectKey.endsWith(".pdf")
    ) {
      console.error("Invalid PDF storage reference for book:", bookId);

      return res.status(500).json({
        message: "Book content could not be retrieved.",
      });
    }

    const rangeHeader = req.headers.range;

    // Reject malformed and multiple ranges before contacting R2.
    if (rangeHeader && !isValidRangeHeader(rangeHeader)) {
      return res.status(400).json({
        message: "Requested PDF byte range is not supported.",
      });
    }

    let pdf;

    try {
      pdf = await getStoredPdf(objectKey, rangeHeader);
    } catch (error) {
      if (!rangeHeader || !isInvalidRangeError(error)) {
        throw error;
      }

      // Only invalid ranges trigger this additional R2 HEAD request.
      const totalSize = await getStoredPdfSize(objectKey);

      return res
        .status(416)
        .setHeader("Content-Range", `bytes */${totalSize}`)
        .json({
          message: "Requested PDF byte range is not satisfiable.",
        });
    }

    if (!pdf.Body || pdf.ContentLength === undefined) {
      throw new Error("PDF response from storage is incomplete.");
    }

    // A Range request must never silently receive a full PDF response.
    if (rangeHeader && !pdf.ContentRange) {
      throw new Error("Storage did not honor the requested PDF byte range.");
    }

    res.setHeader("Content-Type", "application/pdf");

    res.setHeader("Content-Disposition", 'inline; filename="book.pdf"');

    res.setHeader("Accept-Ranges", "bytes");

    res.setHeader("Cache-Control", "private, no-store");

    res.setHeader("X-Content-Type-Options", "nosniff");

    res.setHeader("Content-Length", pdf.ContentLength);

    if (pdf.ContentRange) {
      res.setHeader("Content-Range", pdf.ContentRange);
    }

    res.status(pdf.ContentRange ? 206 : 200);

    // Stream directly from R2 without loading the complete PDF into memory.
    const body = pdf.Body as NodeJS.ReadableStream;

    try {
      await pipeline(body, res);
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ERR_STREAM_PREMATURE_CLOSE" &&
        res.destroyed
      ) {
        return;
      }

      console.error("PDF storage stream failed:", error);

      if (!res.headersSent) {
        return res.status(500).json({
          message: "Book content could not be streamed.",
        });
      }

      // The response has already started. It cannot safely be replaced
      // with a JSON error response.
      res.destroy();
    }
  } catch (error) {
    return next(error);
  }
});

export default router;
