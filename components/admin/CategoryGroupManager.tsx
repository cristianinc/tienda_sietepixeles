"use client";

import { FormEvent, useState } from "react";
import type { CategoryGroup } from "@/lib/category-groups";

type ProductOption = {
  id: number;
  name: string;
  slug: string;
  category_name: string | null;
  is_active: boolean;
};

type Props = {
  initialGroups: CategoryGroup[];
  initialProducts: ProductOption[];
};

type GroupForm = {
  id: number;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
  product_ids: number[];
};

const emptyForm: GroupForm = {
  id: 0,
  name: "",
  slug: "",
  description: "",
  image_url: "/images/logo.jpg",
  sort_order: 0,
  is_active: true,
  product_ids: [],
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function CategoryGroupManager({ initialGroups, initialProducts }: Props) {
  const [groups, setGroups] = useState<CategoryGroup[]>(initialGroups);
  const [products] = useState<ProductOption[]>(initialProducts);
  const [form, setForm] = useState<GroupForm>(emptyForm);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();
  const selectedProducts = form.product_ids
    .map((id) => products.find((product) => Number(product.id) === Number(id)))
    .filter((product): product is ProductOption => Boolean(product));
  const availableProducts = products
    .filter((product) => !form.product_ids.includes(product.id))
    .filter((product) => {
      if (!normalizedQuery) return true;
      const searchable = `${product.name} ${product.slug} ${product.category_name ?? ""}`.toLowerCase();
      return searchable.includes(normalizedQuery);
    })
    .slice(0, 40);

  async function loadGroups() {
    const response = await fetch("/api/agrupadores");
    const data = (await response.json()) as { groups?: CategoryGroup[] };
    setGroups(data.groups ?? []);
  }

  async function saveGroup(event: FormEvent) {
    event.preventDefault();
    setMessage("");

    const response = await fetch(form.id ? `/api/agrupadores/${form.id}` : "/api/agrupadores", {
      method: form.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        slug: form.slug || slugify(form.name),
        description: form.description || null,
        image_url: form.image_url || null,
        sort_order: Number(form.sort_order),
        is_active: form.is_active,
        product_ids: form.product_ids,
      }),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setMessage(data.error ?? "No se pudo guardar el agrupador.");
      return;
    }

    setForm(emptyForm);
    setMessage("Agrupador guardado correctamente.");
    await loadGroups();
  }

  async function deleteGroup(id: number) {
    if (!window.confirm("Estas seguro de eliminar este agrupador?")) return;
    const response = await fetch(`/api/agrupadores/${id}`, { method: "DELETE" });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setMessage(data.error ?? "No se pudo eliminar el agrupador.");
      return;
    }

    await loadGroups();
  }

  function toggleProduct(productId: number) {
    setForm((current) => ({
      ...current,
      product_ids: current.product_ids.includes(productId)
        ? current.product_ids.filter((id) => id !== productId)
        : [...current.product_ids, productId],
    }));
  }

  function removeProduct(productId: number) {
    setForm((current) => ({
      ...current,
      product_ids: current.product_ids.filter((id) => id !== productId),
    }));
  }

  function clearProducts() {
    setForm((current) => ({
      ...current,
      product_ids: [],
    }));
  }

  function editGroup(group: CategoryGroup) {
    setForm({
      id: group.id,
      name: group.name,
      slug: group.slug,
      description: group.description ?? "",
      image_url: group.image_url ?? "",
      sort_order: group.sort_order,
      is_active: group.is_active,
      product_ids: group.products.map((product) => Number(product.id)),
    });
    setQuery("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <form onSubmit={saveGroup} className="h-fit space-y-4 rounded-2xl border border-[var(--color-muted)] bg-white p-5">
        <h2 className="font-serif text-3xl">{form.id ? "Editar agrupador" : "Nuevo agrupador"}</h2>
        <label className="block text-sm font-semibold">
          Nombre
          <input
            required
            value={form.name}
            onChange={(event) => {
              const name = event.target.value;
              setForm((current) => ({ ...current, name, slug: current.slug || slugify(name) }));
            }}
            className="mt-2 w-full rounded-xl border border-[var(--color-muted)] px-4 py-3"
          />
        </label>
        <label className="block text-sm font-semibold">
          Slug
          <input
            required
            value={form.slug}
            onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
            className="mt-2 w-full rounded-xl border border-[var(--color-muted)] px-4 py-3"
          />
        </label>
        <label className="block text-sm font-semibold">
          Descripcion
          <textarea
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            className="mt-2 min-h-24 w-full rounded-xl border border-[var(--color-muted)] px-4 py-3"
          />
        </label>
        <label className="block text-sm font-semibold">
          URL imagen
          <input
            value={form.image_url}
            onChange={(event) => setForm((current) => ({ ...current, image_url: event.target.value }))}
            className="mt-2 w-full rounded-xl border border-[var(--color-muted)] px-4 py-3"
          />
        </label>
        <label className="block text-sm font-semibold">
          Orden
          <input
            type="number"
            value={form.sort_order}
            onChange={(event) => setForm((current) => ({ ...current, sort_order: Number(event.target.value) }))}
            className="mt-2 w-full rounded-xl border border-[var(--color-muted)] px-4 py-3"
          />
        </label>

        <fieldset className="space-y-3 rounded-2xl bg-[var(--color-cream)] p-4">
          <legend className="text-sm font-semibold">Productos incluidos</legend>

          <div className="rounded-xl border border-[var(--color-muted)] bg-white p-3">
            <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-soft-ink)]">
              Buscar producto
            </label>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ej: blazer, vestido, pantalones"
              className="mt-2 w-full rounded-xl border border-[var(--color-muted)] px-3 py-2 text-sm"
            />
            <p className="mt-2 text-xs text-[var(--color-soft-ink)]">
              Seleccionados: {selectedProducts.length}
            </p>
          </div>

          <div className="rounded-xl border border-[var(--color-muted)] bg-white p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-soft-ink)]">
                Seleccionados
              </p>
              <button
                type="button"
                onClick={clearProducts}
                disabled={selectedProducts.length === 0}
                className="rounded-full border border-red-300 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 transition hover:border-red-500 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Quitar todos
              </button>
            </div>
            {selectedProducts.length === 0 ? (
              <p className="text-sm text-[var(--color-soft-ink)]">Aun no hay productos en este agrupador.</p>
            ) : (
              <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
                {selectedProducts.map((product) => (
                  <div key={product.id} className="flex items-start justify-between gap-2 rounded-lg border border-[var(--color-muted)] px-3 py-2">
                    <span>
                      <span className="block text-sm font-semibold">{product.name}</span>
                      <span className="block text-xs text-[var(--color-soft-ink)]">{product.category_name ?? "Sin categoria"}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeProduct(product.id)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-red-300 bg-red-50 text-base font-bold leading-none text-red-700 transition hover:border-red-500 hover:bg-red-100"
                      aria-label={`Quitar ${product.name}`}
                      title={`Quitar ${product.name}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-[var(--color-muted)] bg-white p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-soft-ink)]">
              Resultados
            </p>
            {availableProducts.length === 0 ? (
              <p className="text-sm text-[var(--color-soft-ink)]">No hay resultados con esa busqueda.</p>
            ) : (
              <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                {availableProducts.map((product) => (
                  <div key={product.id} className="flex items-start justify-between gap-2 rounded-lg border border-[var(--color-muted)] px-3 py-2">
                    <span>
                      <span className="block text-sm font-semibold">{product.name}</span>
                      <span className="block text-xs text-[var(--color-soft-ink)]">{product.category_name ?? "Sin categoria"}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleProduct(product.id)}
                      className="rounded-full bg-[var(--color-ink)] px-2 py-1 text-xs font-semibold text-white hover:bg-[var(--color-clay)]"
                    >
                      Agregar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </fieldset>

        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
          />
          Activo
        </label>
        <div className="flex gap-2">
          <button type="submit" className="rounded-full bg-[var(--color-ink)] px-5 py-2 text-sm font-semibold text-white">
            Guardar
          </button>
          {form.id ? (
            <button type="button" onClick={() => setForm(emptyForm)} className="rounded-full border border-[var(--color-muted)] px-5 py-2 text-sm font-semibold">
              Cancelar
            </button>
          ) : null}
        </div>
        {message ? <p className="text-sm text-[var(--color-soft-ink)]">{message}</p> : null}
      </form>

      <div className="overflow-hidden rounded-2xl border border-[var(--color-muted)] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--color-sand)] text-[var(--color-soft-ink)]">
            <tr>
              <th className="px-4 py-3">Agrupador</th>
              <th className="px-4 py-3">Productos</th>
              <th className="px-4 py-3">Orden</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <tr key={group.id} className="border-t border-[var(--color-muted)] align-top">
                <td className="px-4 py-3">
                  <p className="font-semibold">{group.name}</p>
                  <p className="text-xs text-[var(--color-soft-ink)]">{group.slug}</p>
                </td>
                <td className="px-4 py-3 text-[var(--color-soft-ink)]">
                  {group.products.map((product) => product.name).join(" · ") || "Sin productos"}
                </td>
                <td className="px-4 py-3">{group.sort_order}</td>
                <td className="px-4 py-3">{group.is_active ? "Activo" : "Inactivo"}</td>
                <td className="space-x-2 px-4 py-3">
                  <button type="button" onClick={() => editGroup(group)} className="font-semibold text-[var(--color-clay)]">
                    Editar
                  </button>
                  <button type="button" onClick={() => deleteGroup(group.id)} className="font-semibold text-red-700">
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
