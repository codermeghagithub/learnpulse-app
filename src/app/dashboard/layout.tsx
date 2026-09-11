import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { AnimatedBackground } from "@/components/layout/AnimatedBackground";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    const fallbackRole = (user.user_metadata?.role as "student" | "teacher") || "student";
    const fullName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Student";
    await supabase.from("profiles").upsert({
      id: user.id,
      full_name: fullName,
      role: fallbackRole,
    });
    const { data: refetched } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .single();
    profile = refetched;
  }

  if (!profile || profile.role !== "student") {
    redirect(profile?.role === "teacher" ? "/teacher" : "/login");
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen overflow-x-hidden bg-background relative">
      {/* Dynamic Animated Background with Framer Motion */}
      <AnimatedBackground />

      <Sidebar role="student" fullName={profile.full_name} />
      <main className="flex-1 min-w-0 lg:h-screen lg:overflow-y-auto scrollbar-thin relative z-10 pb-safe">
        {children}
      </main>
    </div>
  );
}
