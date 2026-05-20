import { z } from "zod";

export const variantSchema = z.object({
  size: z.string().min(1),
  color: z.string().min(1),
  stock: z.number().int().min(0),
  sku: z.string().min(3),
});

export const productSchema = z.object({
  category_id: z.number().int().positive(),
  name: z.string().min(3),
  slug: z.string().min(3),
  description: z.string().min(10),
  price: z.number().positive(),
  image_url: z.string().optional(),
  discount_price: z.number().positive().optional(),
  is_active: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  variants: z.array(variantSchema).min(1),
});

export const updateProductSchema = productSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "Debes enviar al menos un campo para actualizar",
);
