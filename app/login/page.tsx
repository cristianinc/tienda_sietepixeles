"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaFactorId, setMfaFactorId] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function getRedirectPath() {
    const redirect = new URLSearchParams(window.location.search).get("redirect");
    return redirect?.startsWith("/admin") ? redirect : "/admin";
  }

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setIsLoading(false);
      setMessage("Correo o contrasena incorrectos.");
      return;
    }

    const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assurance?.currentLevel === "aal2") {
      window.location.href = getRedirectPath();
      return;
    }

    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
    const verifiedTotp = factors?.totp?.[0];

    setIsLoading(false);

    if (factorsError) {
      setMessage("No se pudo revisar la configuracion MFA.");
      return;
    }

    if (!verifiedTotp) {
      window.location.href = "/admin/mfa/setup";
      return;
    }

    setMfaFactorId(verifiedTotp.id);
    setMessage("Ingresa el codigo de tu autenticador.");
  }

  async function verifyMfa(event: FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: mfaFactorId,
      code: mfaCode,
    });

    setIsLoading(false);

    if (!error) {
      window.location.href = getRedirectPath();
      return;
    }

    setMessage("Codigo de autenticador incorrecto.");
  }

  return (
    <section className="mx-auto max-w-md space-y-6 rounded-2xl border border-[var(--color-muted)] bg-white p-6">
      <h1 className="font-serif text-3xl">Acceso seguro admin</h1>
      {mfaFactorId ? (
        <form onSubmit={verifyMfa} className="space-y-3">
          <input
            required
            inputMode="numeric"
            maxLength={6}
            value={mfaCode}
            onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, ""))}
            placeholder="Codigo de 6 digitos"
            className="w-full rounded-xl border border-[var(--color-muted)] px-4 py-3"
          />
          <button type="submit" className="w-full rounded-xl bg-[var(--color-ink)] px-4 py-3 text-white">
            {isLoading ? "Verificando..." : "Verificar codigo"}
          </button>
        </form>
      ) : (
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
      )}
      <p className="rounded-xl bg-[var(--color-cream)] p-4 text-sm text-[var(--color-soft-ink)]">
        Usa un usuario creado en Supabase Auth, autorizado en ADMIN_EMAILS y protegido con autenticador.
      </p>
      {message ? <p className="text-sm text-[var(--color-soft-ink)]">{message}</p> : null}
    </section>
  );
}
