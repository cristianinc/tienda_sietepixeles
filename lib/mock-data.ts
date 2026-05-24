import type { Product } from "@/types/product";

export const mockProducts: Product[] = [
  {
    id: "1",
    slug: "blazer-lino-amelia",
    name: "Blazer Lino Amelia",
    description: "Corte relajado para uso diario y ocasiones especiales.",
    price: 49990,
    discountPrice: 42990,
    imageUrl: "/images/images-1779314653582.jpeg",
    isFeatured: true,
    variants: [
      { id: "v1", size: "S", color: "Arena", stock: 5, sku: "BLAZ-S-ARE" },
      { id: "v2", size: "M", color: "Arena", stock: 8, sku: "BLAZ-M-ARE" },
    ],
  },
  {
    id: "2",
    slug: "vestido-satin-noche",
    name: "Vestido Satin Noche",
    description: "Silueta suave con caida elegante y textura luminosa.",
    price: 39990,
    imageUrl: "/images/images-1779314653582.jpeg",
    isFeatured: true,
    variants: [
      { id: "v3", size: "S", color: "Negro", stock: 4, sku: "VEST-S-NEG" },
      { id: "v4", size: "M", color: "Negro", stock: 7, sku: "VEST-M-NEG" },
    ],
  },
];
