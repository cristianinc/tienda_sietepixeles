"use client";

import { FormEvent, useState } from "react";

type Category = {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
};

type Props = {
  initialCategories: Category[];
};

const emptyForm: Category = {
  id: 0,
  name: "",
  slug: "",
  image_url: "/images/images-1779314653582.jpeg",
  sort_order: 0,
  is_active: true,
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function CategoryManager({ initialCategories }: Props) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [form, setForm] = useState<Category>(emptyForm);
  const [message, setMessage] = useState("");

  async function loadCategories() {
    const response = await fetch("/api/categorias");
    const data = (await response.json()) as { categories?: Category[] };
    setCategories(data.categories ?? []);
  }

  async function saveCategory(event: FormEvent) {
    event.preventDefault();
    setMessage("");

    const response = await fetch(form.id ? `/api/categorias/${form.id}` : "/api/categorias", {
      method: form.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        slug: form.slug || slugify(form.name),
        image_url: form.image_url || null,
        sort_order: Number(form.sort_order),
        is_active: form.is_active,
      }),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setMessage(data.error ?? "No se pudo guardar la categoria.");
      return;
    }

    setForm(emptyForm);
    setMessage("Categoria guardada correctamente.");
    await loadCategories();
  }

  async function deleteCategory(id: number) {
    if (!window.confirm("Estas seguro de eliminar esta categoria?")) return;
    const response = await fetch(`/api/categorias/${id}`, { method: "DELETE" });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setMessage(data.error ?? "No se pudo eliminar la categoria.");
      return;
    }

    await loadCategories();
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <form onSubmit={saveCategory} className="h-fit space-y-4 rounded-2xl border border-[var(--color-muted)] bg-white p-5">
        <h2 className="font-serif text-3xl">{form.id ? "Editar categoria" : "Nueva categoria"}</h2>
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
          URL imagen
          <input
            value={form.image_url ?? ""}
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
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
          />
          Activa
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
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Orden</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id} className="border-t border-[var(--color-muted)]">
                <td className="px-4 py-3 font-semibold">{category.name}</td>
                <td className="px-4 py-3 text-[var(--color-soft-ink)]">{category.slug}</td>
                <td className="px-4 py-3">{category.sort_order}</td>
                <td className="px-4 py-3">{category.is_active ? "Activa" : "Inactiva"}</td>
                <td className="space-x-2 px-4 py-3">
                  <button type="button" onClick={() => setForm({ ...category, image_url: category.image_url ?? "" })} className="font-semibold text-[var(--color-clay)]">
                    Editar
                  </button>
                  <button type="button" onClick={() => deleteCategory(category.id)} className="font-semibold text-red-700">
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
