import { z } from "zod";

const name = z.string().trim().min(1).max(120);
const slug = z.string().trim().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const categorySchema = z.object({
  name,
  slug,
  image_url: z.string().trim().max(2_000).optional(),
  sort_order: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
});

export const optionSchema = z.object({
  name,
  sort_order: z.number().int().min(0).optional(),
  hex: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  is_active: z.boolean().optional(),
});

export const categoryGroupSchema = z.object({
  name,
  slug,
  description: z.string().trim().max(2_000).optional().nullable(),
  image_url: z.string().trim().max(2_000).optional().nullable(),
  sort_order: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
  product_ids: z.array(z.number().int().positive()).max(200).optional(),
});
