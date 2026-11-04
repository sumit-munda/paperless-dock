import z from "zod";

const digitalBookQuantitySchema = z
  .number()
  .int("Quantity must be a whole number.")
  .min(1, "Quantity must be at least 1.")
  .max(99, "Quantity cannot exceed 99.")
  .superRefine((quantity, ctx) => {
    if (quantity !== 1) {
      ctx.addIssue({
        code: "custom",
        message: "Digital books can only have a quantity of 1.",
      });
    }
  });

export const addCartItemSchema = z
  .object({
    bookId: z.string().trim().min(1, "Book ID is required."),
    quantity: digitalBookQuantitySchema.default(1),
  })
  .strict();

export const updateCartItemSchema = z
  .object({
    quantity: digitalBookQuantitySchema,
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
            quantity: digitalBookQuantitySchema,
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

export type MigrateGuestCartInput = z.infer<
  typeof migrateGuestCartSchema
>;