import { Request, Response, NextFunction } from "express";
import multer, { MulterError } from "multer";

const MAX_PDF_SIZE = 25 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: MAX_PDF_SIZE,
    files: 1,
  },

  fileFilter: (_req, file, callback) => {
    if (file.mimetype !== "application/pdf") {
      return callback(new Error("Only PDF files are allowed."));
    }

    return callback(null, true);
  },
});

export function uploadPdf(req: Request, res: Response, next: NextFunction) {
  upload.single("file")(req, res, (error: unknown) => {
    if (error instanceof MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          message: "PDF file must not exceed 25 MB.",
        });
      }

      if (
        error.code === "LIMIT_FIELD_COUNT" ||
        error.code === "LIMIT_UNEXPECTED_FILE"
      ) {
        return res.status(400).json({
          message:
            "Please upload exactly one PDF file using the field name 'file'.",
        });
      }

      return res.status(400).json({
        message: "PDF upload could not be processed.",
      });
    }

    if (error) {
      return res.status(400).json({
        message:
          error instanceof Error &&
          error.message === "Only PDF files are allowed."
            ? error.message
            : "PDF upload could not be processed.",
      });
    }

    return next();
  });
}
