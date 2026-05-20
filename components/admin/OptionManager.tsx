"use client";

import { FormEvent, useState } from "react";

type OptionItem = {
  id: number;
  name: string;
  sort_order?: number;
  hex?: string | null;
  is_active: boolean;
};

type Props = {
  title: string;
  apiPath: "/api/tallas" | "/api/colores";
  responseKey: "sizes" | "colors";
  initialItems: OptionItem[];
  hasHex?: boolean;
  hasSortOrder?: boolean;
};

const emptyForm = { id: 0, name: "", sort_order: 0, hex: "", is_active: true };

export function OptionManager({ title, apiPath, responseKey, initialItems, hasHex = false, hasSortOrder = false }: Props) {
  const [items, setItems] = useState<OptionItem[]>(initialItems);
  const [form, setForm] = useState<OptionItem>(emptyForm);
  const [message, setMessage] = useState("");

  async function loadItems() {
    const response = await fetch(apiPath);
    const data = (await response.json()) as { [key: string]: OptionItem[] };
    setItems(data[responseKey] ?? []);
  }

  async function saveItem(event: FormEvent) {
    event.preventDefault();
    setMessage("");

    const payload = {
      name: form.name,
      sort_order: Number(form.sort_order ?? 0),
      hex: form.hex || null,
      is_active: form.is_active,
    };
    const url = form.id ? `${apiPath}/${form.id}` : apiPath;
    const response = await fetch(url, {
      method: form.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setMessage(data.error ?? "No se pudo guardar.");
      return;
    }

    setForm(emptyForm);
    setMessage("Guardado correctamente.");
    await loadItems();
  }

  async function deleteItem(id: number) {
    if (!window.confirm("Estas seguro de eliminar este registro?")) return;
    await fetch(`${apiPath}/${id}`, { method: "DELETE" });
    await loadItems();
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <form onSubmit={saveItem} className="h-fit space-y-4 rounded-2xl border border-[var(--color-muted)] bg-white p-5">
        <h2 className="font-serif text-3xl">{form.id ? `Editar ${title}` : `Nueva ${title}`}</h2>
        <label className="block text-sm font-semibold">
          Nombre
          <input
            required
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            className="mt-2 w-full rounded-xl border border-[var(--color-muted)] px-4 py-3"
          />
        </label>
        {hasSortOrder ? (
          <label className="block text-sm font-semibold">
            Orden
            <input
              type="number"
              value={form.sort_order ?? 0}
              onChange={(event) => setForm((current) => ({ ...current, sort_order: Number(event.target.value) }))}
              className="mt-2 w-full rounded-xl border border-[var(--color-muted)] px-4 py-3"
            />
          </label>
        ) : null}
        {hasHex ? (
          <label className="block text-sm font-semibold">
            Color HEX
            <input
              placeholder="#111111"
              value={form.hex ?? ""}
              onChange={(event) => setForm((current) => ({ ...current, hex: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-[var(--color-muted)] px-4 py-3"
            />
          </label>
        ) : null}
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
              <th className="px-4 py-3">Nombre</th>
              {hasSortOrder ? <th className="px-4 py-3">Orden</th> : null}
              {hasHex ? <th className="px-4 py-3">Muestra</th> : null}
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-[var(--color-muted)]">
                <td className="px-4 py-3 font-semibold">{item.name}</td>
                {hasSortOrder ? <td className="px-4 py-3">{item.sort_order}</td> : null}
                {hasHex ? (
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full border" style={{ backgroundColor: item.hex ?? "transparent" }} />
                      {item.hex ?? "-"}
                    </span>
                  </td>
                ) : null}
                <td className="px-4 py-3">{item.is_active ? "Activo" : "Inactivo"}</td>
                <td className="space-x-2 px-4 py-3">
                  <button type="button" onClick={() => setForm({ ...emptyForm, ...item, hex: item.hex ?? "" })} className="font-semibold text-[var(--color-clay)]">
                    Editar
                  </button>
                  <button type="button" onClick={() => deleteItem(item.id)} className="font-semibold text-red-700">
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
