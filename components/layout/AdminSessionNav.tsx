"use client";

import { useEffect, useState } from "react";

export function AdminSessionNav() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function checkAdminSession() {
      const response = await fetch("/api/admin/session", { cache: "no-store" });
      if (!ignore) setIsAdmin(response.ok);
    }

    checkAdminSession();

    return () => {
      ignore = true;
    };
  }, []);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsAdmin(false);
    window.location.href = "/login";
  }

  if (!isAdmin) return null;

  return (
    <button type="button" onClick={signOut} className="transition hover:text-[var(--color-clay)]">
      Salir
    </button>
  );
}
