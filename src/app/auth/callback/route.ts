import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      // Check if profile exists; if not, create one from user metadata
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      let userRole = profile?.role;

      if (!userRole) {
        userRole = (data.user.user_metadata?.role as "student" | "teacher") || "student";
        const fullName =
          data.user.user_metadata?.full_name ||
          data.user.email?.split("@")[0] ||
          "User";

        await supabase.from("profiles").upsert({
          id: data.user.id,
          full_name: fullName,
          role: userRole,
        });
      }

      const redirectPath = userRole === "teacher" ? "/teacher" : "/dashboard";
      return NextResponse.redirect(new URL(redirectPath, requestUrl.origin));
    }
  }

  // If code exchange fails or no code was provided
  return NextResponse.redirect(new URL("/login?error=verification_failed", requestUrl.origin));
}
