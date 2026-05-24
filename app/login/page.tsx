"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (!error) {
      const redirect = new URLSearchParams(window.location.search).get("redirect");
      window.location.href = redirect?.startsWith("/admin") ? redirect : "/admin";
      return;
    }

    setMessage("Correo o contrasena incorrectos.");
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
      <p className="rounded-xl bg-[var(--color-cream)] p-4 text-sm text-[var(--color-soft-ink)]">
        Usa un usuario creado en Supabase Auth y autorizado en la variable ADMIN_EMAILS.
      </p>
      {message ? <p className="text-sm text-[var(--color-soft-ink)]">{message}</p> : null}
    </section>
  );
}
