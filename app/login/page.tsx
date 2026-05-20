"use client";

import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [user, setUser] = useState("admin");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    const response = await fetch("/api/auth/local", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, code }),
    });

    setIsLoading(false);

    if (response.ok) {
      window.location.href = "/admin";
      return;
    }

    const data = (await response.json()) as { message?: string };
    setMessage(data.message ?? "No se pudo iniciar sesion.");
  }

  return (
    <section className="mx-auto max-w-md space-y-6 rounded-2xl border border-[var(--color-muted)] bg-white p-6">
      <h1 className="font-serif text-3xl">Acceso admin</h1>
      <form onSubmit={signIn} className="space-y-3">
        <input
          required
          value={user}
          onChange={(event) => setUser(event.target.value)}
          placeholder="Usuario"
          className="w-full rounded-xl border border-[var(--color-muted)] px-4 py-3"
        />
        <input
          required
          type="password"
          inputMode="numeric"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Codigo de autorizacion"
          className="w-full rounded-xl border border-[var(--color-muted)] px-4 py-3"
        />
        <button type="submit" className="w-full rounded-xl bg-[var(--color-ink)] px-4 py-3 text-white">
          {isLoading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
      <div className="rounded-xl bg-[var(--color-cream)] p-4 text-sm text-[var(--color-soft-ink)]">
        <p>Acceso local de prueba:</p>
        <p>Usuario: admin</p>
        <p>Codigo: 482916</p>
      </div>
      {message ? <p className="text-sm text-[var(--color-soft-ink)]">{message}</p> : null}
    </section>
  );
}
