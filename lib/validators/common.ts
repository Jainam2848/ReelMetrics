import { z } from "zod";

/**
 * Standard Zod validation schema for UUIDs.
 */
export const uuidSchema = z.string().uuid({
  message: "Invalid UUID format",
});

/**
 * Common Zod validation schema for paginated API requests.
 */
export const paginationSchema = z.object({
  page: z.coerce
    .number()
    .int("Page must be an integer")
    .positive("Page must be a positive number")
    .default(1),
  limit: z.coerce
    .number()
    .int("Limit must be an integer")
    .positive("Limit must be a positive number")
    .max(100, "Limit cannot exceed 100")
    .default(10),
  sort: z.string().optional(),
  order: z
    .enum(["asc", "desc"], {
      message: "Order must be 'asc' or 'desc'",
    })
    .default("desc"),
});

/**
 * Common Zod validation schema for filtering by date ranges.
 */
export const dateRangeSchema = z
  .object({
    from: z
      .string()
      .datetime({ message: "Invalid ISO datetime for 'from'" })
      .optional(),
    to: z
      .string()
      .datetime({ message: "Invalid ISO datetime for 'to'" })
      .optional(),
  })
  .refine(
    (data) => {
      if (data.from && data.to) {
        return new Date(data.from) <= new Date(data.to);
      }
      return true;
    },
    {
      message: "'from' date must be before or equal to 'to' date",
      path: ["from"],
    }
  );
