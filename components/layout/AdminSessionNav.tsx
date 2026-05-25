"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AdminSessionNav() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let ignore = false;
    const supabase = createClient();

    async function checkAdminSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        if (!ignore) setIsAdmin(false);
        return;
      }

      const response = await fetch("/api/admin/session", { cache: "no-store" });
      if (!ignore) setIsAdmin(response.ok);
    }

    checkAdminSession();

    const { data } = supabase.auth.onAuthStateChange(() => {
      checkAdminSession();
    });

    return () => {
      ignore = true;
      data.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
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
