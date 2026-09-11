import { createClient } from "@/utils/supabase/server";

export type UserRole = "student" | "teacher";

export async function requireAuth(requiredRole?: UserRole) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (requiredRole) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .single();

    if (profile?.role !== requiredRole) {
      throw new Error(`Forbidden: ${requiredRole} role required`);
    }

    return { supabase, user, profile };
  }

  return { supabase, user };
}
