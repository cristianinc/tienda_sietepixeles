import { createClient } from "@/lib/supabase/server";

export async function getUserRole() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const role = (user.app_metadata.role as string | undefined) ?? "customer";
  return { user, role };
}
