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

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "teacher") {
    redirect(profile?.role === "student" ? "/dashboard" : "/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background relative">
      <AnimatedBackground />
      <Sidebar role="teacher" fullName={profile.full_name} />
      <main className="flex-1 overflow-y-auto scrollbar-thin relative z-10 pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
