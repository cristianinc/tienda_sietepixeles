export type ProductVariant = {
  id: string;
  size: string;
  color: string;
  stock: number;
  sku: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  imageUrl: string;
  isFeatured: boolean;
  variants: ProductVariant[];
};
