"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaFactorId, setMfaFactorId] = useState("");
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

  async function continueAfterPassword() {
    const supabase = createClient();
    const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assurance?.currentLevel === "aal2") {
      window.location.assign(getRedirectPath());
      return;
    }

    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
    const verifiedTotp = factors?.totp?.[0];

    if (factorsError) {
      setMessage("No se pudo revisar la configuracion MFA.");
      return;
    }

    if (!verifiedTotp) {
      setMessage("Sesion correcta. Redirigiendo a configurar autenticador...");
      window.location.assign("/admin/mfa/setup");
      return;
    }

    setMfaFactorId(verifiedTotp.id);
    setMessage("Ingresa el codigo de tu autenticador.");
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

    await continueAfterPassword();
    setIsLoading(false);
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
      window.location.assign(getRedirectPath());
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
      {message ? <p className="text-sm text-[var(--color-soft-ink)]">{message}</p> : null}
    </section>
  );
}
