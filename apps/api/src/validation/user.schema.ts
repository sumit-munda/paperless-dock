import z from "zod";

export const updateUserSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must contain at least 2 characters.")
      .max(80, "Name cannot exceed 80 characters.")
      .optional(),

    avatar: z
      .string()
      .trim()
      .url("Enter a valid avatar URL.")
      .max(2048, "Avatar URL is too long.")
      .nullable()
      .optional(),
  })
  .strict()
  .refine((data) => data.name !== undefined || data.avatar !== undefined, {
    message: "Provide at least one field to update.",
  });

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
