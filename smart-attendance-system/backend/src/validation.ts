import { z } from "zod";

export const uuid = z.uuid();
export const isoDate = z.iso.date();
export const status = z.enum(["present", "late", "absent"]);

// ~6 MB decoded; the face service enforces the same limit.
export const imageDataUrl = z
  .string()
  .max(8_500_000, "Image is too large")
  .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/, "Image must be a JPEG, PNG or WebP data URL");

export const idParam = z.object({ id: uuid });

const text = (max: number) => z.string().trim().min(1).max(max);

export const classInput = z.object({
  code: text(20).transform((v) => v.toUpperCase()),
  name: text(120),
  department: text(120),
});

export const studentInput = z.object({
  name: text(120),
  rollNumber: text(32).transform((v) => v.toUpperCase()),
  department: text(120),
  classId: uuid.nullable().optional(),
});
