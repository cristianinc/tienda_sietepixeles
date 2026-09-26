"use client";

import type { FormEvent } from "react";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("error") === "unauthorized"
      ? "Tu correo no esta autorizado como administrador."
      : "";
  });
  const [isLoading, setIsLoading] = useState(false);

  function getRedirectPath() {
    const redirect = new URLSearchParams(window.location.search).get("redirect");
    return redirect?.startsWith("/admin") ? redirect : "/admin";
  }

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const result = (await response.json()) as { error?: string };

    if (!response.ok) {
      setIsLoading(false);
      setMessage(result.error ?? "Correo o contrasena incorrectos.");
      return;
    }

    window.location.assign(getRedirectPath());
  }

  return (
    <section className="mx-auto max-w-md space-y-6 rounded-2xl border border-[var(--color-muted)] bg-white p-6">
      <h1 className="font-serif text-3xl">Acceso seguro admin</h1>
      <form onSubmit={signIn} className="space-y-3">
        <input
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Correo administrador"
          className="w-full rounded-xl border border-[var(--color-muted)] px-4 py-3"
        />
        <input
          required
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Contrasena"
          className="w-full rounded-xl border border-[var(--color-muted)] px-4 py-3"
        />
        <button type="submit" className="w-full rounded-xl bg-[var(--color-ink)] px-4 py-3 text-white">
          {isLoading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
      {message ? <p className="text-sm text-[var(--color-soft-ink)]">{message}</p> : null}
    </section>
  );
}
