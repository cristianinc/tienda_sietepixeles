import { z } from "zod";

export const agentToolNames = [
  "search_products",
  "get_product_details",
  "check_inventory",
  "get_store_information",
] as const;

export const agentToolNameSchema = z.enum(agentToolNames);

export const searchProductsInputSchema = z
  .object({
    query: z.string().trim().min(1).max(120).optional(),
    category: z.string().trim().min(1).max(120).optional(),
    size: z.string().trim().min(1).max(40).optional(),
    color: z.string().trim().min(1).max(80).optional(),
    minPrice: z.number().nonnegative().optional(),
    maxPrice: z.number().nonnegative().optional(),
    onlyAvailable: z.boolean().optional().default(true),
    limit: z.number().int().min(1).max(20).optional().default(10),
  })
  .refine((input) => !input.minPrice || !input.maxPrice || input.minPrice <= input.maxPrice, {
    message: "El precio mínimo no puede superar el precio máximo",
    path: ["minPrice"],
  });

export const getProductDetailsInputSchema = z
  .object({
    slug: z.string().trim().min(3).max(160).optional(),
    productId: z.number().int().positive().optional(),
  })
  .refine((input) => Boolean(input.slug) !== Boolean(input.productId), {
    message: "Indica exactamente un slug o productId",
  });

export const checkInventoryInputSchema = z
  .object({
    sku: z.string().trim().min(3).max(120).optional(),
    productSlug: z.string().trim().min(3).max(160).optional(),
  })
  .refine((input) => Boolean(input.sku) !== Boolean(input.productSlug), {
    message: "Indica exactamente un SKU o productSlug",
  });

const variantOutputSchema = z.object({
  id: z.number().int().positive(),
  size: z.string(),
  color: z.string(),
  sku: z.string(),
  stock: z.number().int().nonnegative(),
  isAvailable: z.boolean(),
});

const productOutputSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  category: z.string().nullable(),
  price: z.number().nonnegative(),
  originalPrice: z.number().nonnegative(),
  imageUrl: z.string().nullable(),
  variants: z.array(variantOutputSchema),
  productUrl: z.string(),
});

export const searchProductsOutputSchema = z.object({
  products: z.array(productOutputSchema),
  total: z.number().int().nonnegative(),
});

export const getProductDetailsOutputSchema = z.object({ product: productOutputSchema.nullable() });

export const checkInventoryOutputSchema = z.object({
  variants: z.array(
    variantOutputSchema.extend({
      productId: z.number().int().positive(),
      productName: z.string(),
      productSlug: z.string(),
    }),
  ),
});

export const storeInformationOutputSchema = z.object({
  name: z.string().nullable(),
  weekdayHours: z.string().nullable(),
  saturdayHours: z.string().nullable(),
  address: z.string().nullable(),
  contactEmail: z.string().email().nullable(),
  shippingPolicy: z.string().nullable(),
  exchangePolicy: z.string().nullable(),
});

export const agentChatRequestSchema = z.object({
  tool: agentToolNameSchema,
  input: z.unknown(),
});

export type AgentToolName = z.infer<typeof agentToolNameSchema>;
export type SearchProductsInput = z.infer<typeof searchProductsInputSchema>;
export type GetProductDetailsInput = z.infer<typeof getProductDetailsInputSchema>;
export type CheckInventoryInput = z.infer<typeof checkInventoryInputSchema>;
export type AgentChatRequest = z.infer<typeof agentChatRequestSchema>;
