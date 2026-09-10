"use client";

import { FormEvent, useState } from "react";

const examples = {
  search_products: '{"query":"vestido","color":"Negro"}',
  get_product_details: '{"slug":"vestido-satin-noche"}',
  check_inventory: '{"productSlug":"vestido-satin-noche"}',
  get_store_information: "{}",
};

type ToolName = keyof typeof examples;

export function AgentToolTester() {
  const [tool, setTool] = useState<ToolName>("search_products");
  const [input, setInput] = useState(examples.search_products);
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setResult("");

    let parsedInput: unknown;
    try {
      parsedInput = JSON.parse(input);
    } catch {
      setResult("El JSON de entrada no es válido.");
      return;
    }

    setIsLoading(true);
    const response = await fetch("/api/agent/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool, input: parsedInput }),
    });
    const data = await response.json();
    setIsLoading(false);
    setResult(JSON.stringify(data, null, 2));
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-[var(--color-muted)] bg-white p-5">
      <label className="block text-sm font-semibold">
        Herramienta de solo lectura
        <select
          value={tool}
          onChange={(event) => {
            const nextTool = event.target.value as ToolName;
            setTool(nextTool);
            setInput(examples[nextTool]);
          }}
          className="mt-2 w-full rounded-xl border border-[var(--color-muted)] px-4 py-3"
        >
          {Object.keys(examples).map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
      </label>
      <label className="block text-sm font-semibold">
        Entrada JSON
        <textarea value={input} onChange={(event) => setInput(event.target.value)} className="mt-2 min-h-32 w-full rounded-xl border border-[var(--color-muted)] p-3 font-mono text-sm" />
      </label>
      <button type="submit" disabled={isLoading} className="rounded-full bg-[var(--color-ink)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
        {isLoading ? "Consultando..." : "Probar herramienta"}
      </button>
      {result ? <pre className="overflow-x-auto rounded-xl bg-[var(--color-cream)] p-4 text-xs">{result}</pre> : null}
    </form>
  );
}
