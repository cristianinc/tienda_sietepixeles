import { z } from "zod";

export const variantSchema = z.object({
  size: z.string().min(1),
  color: z.string().min(1),
  stock: z.number().int().min(0),
  sku: z.string().min(3),
});

const productFieldsSchema = z.object({
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

function validateVariants(
  variants: z.infer<typeof variantSchema>[],
  context: z.RefinementCtx,
) {
  const seenVariants = new Set<string>();
  for (const [index, variant] of variants.entries()) {
    const key = `${variant.size.trim().toLowerCase()}|${variant.color.trim().toLowerCase()}`;
    if (seenVariants.has(key)) {
      context.addIssue({
        code: "custom",
        message: "No se permiten variantes duplicadas de talla y color",
        path: ["variants", index],
      });
    }
    seenVariants.add(key);
  }
}

export const productSchema = productFieldsSchema.superRefine((product, context) => {
  if (product.discount_price && product.discount_price >= product.price) {
    context.addIssue({
      code: "custom",
      message: "El precio de oferta debe ser menor al precio normal",
      path: ["discount_price"],
    });
  }

  validateVariants(product.variants, context);
});

export const updateProductSchema = productFieldsSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "Debes enviar al menos un campo para actualizar")
  .superRefine((product, context) => {
    if (product.variants) {
      validateVariants(product.variants, context);
    }

    if (
      product.discount_price !== undefined &&
      product.price !== undefined &&
      product.discount_price >= product.price
    ) {
      context.addIssue({
        code: "custom",
        message: "El precio de oferta debe ser menor al precio normal",
        path: ["discount_price"],
      });
    }
  });
