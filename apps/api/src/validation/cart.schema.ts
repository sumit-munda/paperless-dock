import z from "zod";
import { TypeOf } from "zod/v3";

export const addCartItemSchema = z
  .object({
    bookId: z.string().trim().min(1, "Book ID is required."),
    quantity: z
      .number()
      .int("Quantity must be a whole number.")
      .min(1, "Quantity must be at least 1.")
      .max(99, "Quantity cannot exceed 99.")
      .default(1),
  })
  .strict();

export const updateCartItemSchema = z
  .object({
    quantity: z
      .number()
      .int("Quantity must be a whole number.")
      .min(1, "Quantity must be at least 1.")
      .max(99, "Quanity cannot exceed 99."),
  })
  .strict();

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;

export const migrateGuestCartSchema = z
  .object({
    migrationId: z.string().uuid("Invalid migration ID."),
    items: z
      .array(
        z
          .object({
            bookId: z.string().trim().min(1, "Book ID is required."),
            quantity: z.number().int().min(1).max(99),
          })
          .strict(),
      )
      .min(1, "At least one cart item is required.")
      .max(100, "Too many cart items."),
  })
  .strict()
  .superRefine((data, ctx) => {
    const bookIds = data.items.map((item) => item.bookId);

    if (new Set(bookIds).size !== bookIds.length) {
      ctx.addIssue({
        code: "custom",
        message: "Duplicate books are not allowed.",
        path: ["items"],
      });
    }
  });

export type MigrateGuestCartInput = z.infer<typeof migrateGuestCartSchema>;
