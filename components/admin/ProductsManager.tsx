"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import type { CatalogProduct, CatalogVariant } from "@/lib/products";

type OptionItem = { id: number; name: string; is_active: boolean };

type ProductForm = {
  id: number | null;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  discount_price: string;
  image_url: string;
  is_active: boolean;
  is_featured: boolean;
  variants: Array<Omit<CatalogVariant, "id"> & { id?: number }>;
};

const emptyVariant = { size: "", color: "", stock: 0, sku: "" };
const emptyForm: ProductForm = {
  id: null,
  category_id: "",
  name: "",
  slug: "",
  description: "",
  price: "",
  discount_price: "",
  image_url: "/images/images-1779314653582.jpeg",
  is_active: true,
  is_featured: false,
  variants: [{ ...emptyVariant }],
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

type Props = {
  initialProducts: CatalogProduct[];
  initialSizes: OptionItem[];
  initialColors: OptionItem[];
  initialCategories: OptionItem[];
};

export function ProductsManager({ initialProducts, initialSizes, initialColors, initialCategories }: Props) {
  const [products, setProducts] = useState<CatalogProduct[]>(initialProducts);
  const [sizes, setSizes] = useState<OptionItem[]>(initialSizes);
  const [colors, setColors] = useState<OptionItem[]>(initialColors);
  const [categories, setCategories] = useState<OptionItem[]>(initialCategories);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [imageOptions, setImageOptions] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    async function loadImages() {
      const response = await fetch("/api/admin/images");
      if (!response.ok) return;

      const data = (await response.json()) as { images?: string[] };
      setImageOptions(data.images ?? []);
    }

    loadImages();
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredProducts = normalizedQuery
    ? products.filter((product) => {
        const searchable = `${product.name} ${product.slug} ${product.category_name ?? ""}`.toLowerCase();
        return searchable.includes(normalizedQuery);
      })
    : products;

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  async function loadData() {
    const [productsResponse, sizesResponse, colorsResponse, categoriesResponse] = await Promise.all([
      fetch("/api/productos"),
      fetch("/api/tallas"),
      fetch("/api/colores"),
      fetch("/api/categorias"),
    ]);
    const productsData = (await productsResponse.json()) as { products?: CatalogProduct[] };
    const sizesData = (await sizesResponse.json()) as { sizes?: OptionItem[] };
    const colorsData = (await colorsResponse.json()) as { colors?: OptionItem[] };
    const categoriesData = (await categoriesResponse.json()) as { categories?: OptionItem[] };

    setProducts(productsData.products ?? []);
    setSizes((sizesData.sizes ?? []).filter((item) => item.is_active));
    setColors((colorsData.colors ?? []).filter((item) => item.is_active));
    setCategories((categoriesData.categories ?? []).filter((item) => item.is_active));
    setPage(1);
  }

  function updateVariant(index: number, field: keyof typeof emptyVariant, value: string | number) {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, [field]: value } : variant,
      ),
    }));
  }

  async function saveProduct(event: FormEvent) {
    event.preventDefault();
    setMessage("");

    const payload = {
      category_id: Number(form.category_id),
      name: form.name,
      slug: form.slug || slugify(form.name),
      description: form.description,
      price: Number(form.price),
      discount_price: form.discount_price ? Number(form.discount_price) : undefined,
      image_url: form.image_url || undefined,
      is_active: form.is_active,
      is_featured: form.is_featured,
      variants: form.variants.map((variant) => ({
        size: variant.size,
        color: variant.color,
        stock: Number(variant.stock),
        sku: variant.sku,
      })),
    };
    const response = await fetch(form.id ? `/api/productos/${form.id}` : "/api/productos", {
      method: form.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setMessage(data.error ?? "No se pudo guardar el producto. Revisa los campos obligatorios.");
      return;
    }

    setForm(emptyForm);
    setMessage("Producto guardado correctamente.");
    await loadData();
  }

  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setMessage("");
    setUploadingImage(true);

    const data = new FormData();
    data.append("image", file);

    const response = await fetch("/api/admin/images", {
      method: "POST",
      body: data,
    });

    setUploadingImage(false);
    event.target.value = "";

    if (!response.ok) {
      const errorData = (await response.json()) as { error?: string };
      setMessage(errorData.error ?? "No se pudo subir la imagen.");
      return;
    }

    const result = (await response.json()) as { url: string; images?: string[] };
    setForm((current) => ({ ...current, image_url: result.url }));
    setImageOptions((current) => result.images ?? Array.from(new Set([result.url, ...current])));
    setMessage("Imagen subida correctamente.");
  }

  async function deleteProduct(id: number) {
    if (!window.confirm("Estas seguro de eliminar este producto?")) return;
    await fetch(`/api/productos/${id}`, { method: "DELETE" });
    await loadData();
  }

  function editProduct(product: CatalogProduct) {
    setForm({
      id: product.id,
      category_id: product.category_id ? String(product.category_id) : "",
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: String(Number(product.price)),
      discount_price: product.discount_price ? String(Number(product.discount_price)) : "",
      image_url: product.image_url ?? "",
      is_active: product.is_active,
      is_featured: product.is_featured,
      variants: product.variants.length ? product.variants : [{ ...emptyVariant }],
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="space-y-8">
      <form onSubmit={saveProduct} className="space-y-5 rounded-2xl border border-[var(--color-muted)] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-3xl">{form.id ? "Editar producto" : "Nuevo producto"}</h2>
          {form.id ? (
            <button type="button" onClick={() => setForm(emptyForm)} className="rounded-full border border-[var(--color-muted)] px-5 py-2 text-sm font-semibold">
              Cancelar edicion
            </button>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold md:col-span-2">
            Categoria
            <select
              required
              value={form.category_id}
              onChange={(event) => setForm((current) => ({ ...current, category_id: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-[var(--color-muted)] px-4 py-3"
            >
              <option value="">Selecciona una categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold">
            Nombre
            <input required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value, slug: current.slug || slugify(event.target.value) }))} className="mt-2 w-full rounded-xl border border-[var(--color-muted)] px-4 py-3" />
          </label>
          <label className="block text-sm font-semibold">
            Slug
            <input required value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} className="mt-2 w-full rounded-xl border border-[var(--color-muted)] px-4 py-3" />
          </label>
          <label className="block text-sm font-semibold md:col-span-2">
            Descripcion
            <textarea required value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="mt-2 min-h-24 w-full rounded-xl border border-[var(--color-muted)] px-4 py-3" />
          </label>
          <label className="block text-sm font-semibold">
            Precio
            <input required type="number" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} className="mt-2 w-full rounded-xl border border-[var(--color-muted)] px-4 py-3" />
          </label>
          <label className="block text-sm font-semibold">
            Precio oferta
            <input type="number" value={form.discount_price} onChange={(event) => setForm((current) => ({ ...current, discount_price: event.target.value }))} className="mt-2 w-full rounded-xl border border-[var(--color-muted)] px-4 py-3" />
          </label>
          <div className="space-y-3 md:col-span-2">
            <label className="block text-sm font-semibold">
              Imagen guardada
              <select
                value={imageOptions.includes(form.image_url) ? form.image_url : ""}
                onChange={(event) => setForm((current) => ({ ...current, image_url: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-[var(--color-muted)] px-4 py-3"
              >
                <option value="">Selecciona una imagen subida</option>
                {imageOptions.map((image) => (
                  <option key={image} value={image}>{image}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold">
              Ruta o URL imagen
              <input value={form.image_url} onChange={(event) => setForm((current) => ({ ...current, image_url: event.target.value }))} className="mt-2 w-full rounded-xl border border-[var(--color-muted)] px-4 py-3" />
            </label>
            <label className="block text-sm font-semibold">
              Subir imagen
              <input type="file" accept="image/*" onChange={uploadImage} disabled={uploadingImage} className="mt-2 w-full rounded-xl border border-[var(--color-muted)] px-4 py-3" />
            </label>
            {uploadingImage ? <p className="text-sm text-[var(--color-soft-ink)]">Subiendo imagen...</p> : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-5">
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.is_active} onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))} />Activo</label>
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.is_featured} onChange={(event) => setForm((current) => ({ ...current, is_featured: event.target.checked }))} />Destacado</label>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-serif text-2xl">Variantes</h3>
            <button type="button" onClick={() => setForm((current) => ({ ...current, variants: [...current.variants, { ...emptyVariant }] }))} className="rounded-full border border-[var(--color-muted)] px-4 py-2 text-sm font-semibold">
              Agregar variante
            </button>
          </div>
          {form.variants.map((variant, index) => (
            <div key={index} className="grid gap-3 rounded-2xl bg-[var(--color-cream)] p-4 md:grid-cols-5">
              <select required value={variant.size} onChange={(event) => updateVariant(index, "size", event.target.value)} className="rounded-xl border border-[var(--color-muted)] px-3 py-2">
                <option value="">Talla</option>
                {sizes.map((size) => <option key={size.id} value={size.name}>{size.name}</option>)}
              </select>
              <select required value={variant.color} onChange={(event) => updateVariant(index, "color", event.target.value)} className="rounded-xl border border-[var(--color-muted)] px-3 py-2">
                <option value="">Color</option>
                {colors.map((color) => <option key={color.id} value={color.name}>{color.name}</option>)}
              </select>
              <input required placeholder="SKU" value={variant.sku} onChange={(event) => updateVariant(index, "sku", event.target.value)} className="rounded-xl border border-[var(--color-muted)] px-3 py-2" />
              <input required type="number" min="0" placeholder="Stock" value={variant.stock} onChange={(event) => updateVariant(index, "stock", Number(event.target.value))} className="rounded-xl border border-[var(--color-muted)] px-3 py-2" />
              <button type="button" onClick={() => setForm((current) => ({ ...current, variants: current.variants.filter((_, variantIndex) => variantIndex !== index) }))} className="rounded-xl border border-[var(--color-muted)] px-3 py-2 text-sm font-semibold">
                Quitar
              </button>
            </div>
          ))}
        </div>

        <button type="submit" className="rounded-full bg-[var(--color-ink)] px-6 py-3 text-sm font-semibold text-white">Guardar producto</button>
        {message ? <p className="text-sm text-[var(--color-soft-ink)]">{message}</p> : null}
      </form>

      <div className="space-y-3">
        <label className="block text-sm font-semibold">
          Buscar en productos
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Ej: blazer, vestido, pantalon"
            className="mt-2 w-full rounded-xl border border-[var(--color-muted)] bg-white px-4 py-3"
          />
        </label>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--color-muted)] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--color-sand)] text-[var(--color-soft-ink)]">
            <tr><th className="px-4 py-3">Producto</th><th className="px-4 py-3">Categoria</th><th className="px-4 py-3">Precio</th><th className="px-4 py-3">Stock</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Acciones</th></tr>
          </thead>
          <tbody>
            {paginatedProducts.map((product) => (
              <tr key={product.id} className="border-t border-[var(--color-muted)]">
                <td className="px-4 py-3 font-semibold">{product.name}</td>
                <td className="px-4 py-3">{product.category_name ?? "Sin categoria"}</td>
                <td className="px-4 py-3">${Number(product.price).toLocaleString("es-CL")}</td>
                <td className="px-4 py-3">{product.variants.reduce((total, variant) => total + variant.stock, 0)}</td>
                <td className="px-4 py-3">{product.is_active ? "Activo" : "Inactivo"}</td>
                <td className="space-x-2 px-4 py-3"><button type="button" onClick={() => editProduct(product)} className="font-semibold text-[var(--color-clay)]">Editar</button><button type="button" onClick={() => deleteProduct(product.id)} className="font-semibold text-red-700">Eliminar</button></td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-muted)] px-4 py-3 text-sm">
          <p className="text-[var(--color-soft-ink)]">
            Mostrando {paginatedProducts.length} de {filteredProducts.length} productos · Pagina {currentPage} de {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={currentPage === 1}
              className="rounded-full border border-[var(--color-muted)] px-4 py-2 text-sm font-semibold transition hover:border-[var(--color-clay)] hover:text-[var(--color-clay)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              disabled={currentPage === totalPages}
              className="rounded-full border border-[var(--color-muted)] px-4 py-2 text-sm font-semibold transition hover:border-[var(--color-clay)] hover:text-[var(--color-clay)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
