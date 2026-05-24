"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Enrollment = {
  factorId: string;
  qrCode: string;
  secret: string;
};

export default function AdminMfaSetupPage() {
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("Preparando autenticador...");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function enrollMfa() {
      const supabase = createClient();
      const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (assurance?.currentLevel === "aal2") {
        window.location.href = "/admin";
        return;
      }

      const { data: factors } = await supabase.auth.mfa.listFactors();
      if (factors?.totp?.length) {
        window.location.href = "/login?redirect=/admin";
        return;
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Sietepixeles Admin",
      });

      if (error) {
        setMessage("No se pudo preparar MFA. Intenta iniciar sesion nuevamente.");
        return;
      }

      setEnrollment({
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
      });
      setMessage("Escanea el QR con tu app autenticadora y escribe el codigo generado.");
    }

    enrollMfa();
  }, []);

  async function verifyEnrollment(event: FormEvent) {
    event.preventDefault();
    if (!enrollment) return;

    setIsLoading(true);
    setMessage("");

    const supabase = createClient();
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId: enrollment.factorId,
    });

    if (challengeError) {
      setIsLoading(false);
      setMessage("No se pudo crear el desafio MFA.");
      return;
    }

    const { error } = await supabase.auth.mfa.verify({
      factorId: enrollment.factorId,
      challengeId: challenge.id,
      code,
    });

    setIsLoading(false);

    if (!error) {
      window.location.href = "/admin";
      return;
    }

    setMessage("Codigo incorrecto. Revisa tu app autenticadora.");
  }

  return (
    <section className="mx-auto max-w-xl space-y-6 rounded-2xl border border-[var(--color-muted)] bg-white p-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-soft-ink)]">Seguridad</p>
        <h1 className="font-serif text-3xl">Configurar autenticador</h1>
        <p className="text-sm text-[var(--color-soft-ink)]">{message}</p>
      </div>

      {enrollment ? (
        <>
          <div className="mx-auto w-fit rounded-2xl border border-[var(--color-muted)] bg-white p-4">
            <Image src={enrollment.qrCode} alt="Codigo QR MFA" width={220} height={220} unoptimized />
          </div>
          <div className="rounded-xl bg-[var(--color-cream)] p-4 text-sm text-[var(--color-soft-ink)]">
            <p className="font-semibold text-[var(--color-ink)]">Clave manual</p>
            <p className="mt-1 break-all font-mono">{enrollment.secret}</p>
          </div>
          <form onSubmit={verifyEnrollment} className="space-y-3">
            <input
              required
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
              placeholder="Codigo de 6 digitos"
              className="w-full rounded-xl border border-[var(--color-muted)] px-4 py-3"
            />
            <button type="submit" className="w-full rounded-xl bg-[var(--color-ink)] px-4 py-3 text-white">
              {isLoading ? "Verificando..." : "Activar MFA"}
            </button>
          </form>
        </>
      ) : null}
    </section>
  );
}
