import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { AnimatedBackground } from "@/components/layout/AnimatedBackground";

export default async function TeacherLayout({
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
    const fallbackRole = (user.user_metadata?.role as "student" | "teacher") || "teacher";
    const fullName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Teacher";
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

  if (!profile || profile.role !== "teacher") {
    redirect(profile?.role === "student" ? "/dashboard" : "/login");
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen overflow-x-hidden bg-background relative">
      <AnimatedBackground />
      <Sidebar role="teacher" fullName={profile.full_name} />
      <main className="flex-1 min-w-0 lg:h-screen lg:overflow-y-auto scrollbar-thin relative z-10 pb-safe">
        {children}
      </main>
    </div>
  );
}
