import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { ArrowLeft, BookPlus } from "lucide-react";
import { CreateCourseForm } from "./CreateCourseForm";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Create New Course — LearnPulse",
  description: "Author a new curriculum and prerequisite dependency graph.",
};

export default async function NewCoursePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "teacher") redirect("/dashboard");

  return (
    <div className="px-8 py-8 max-w-2xl mx-auto space-y-8 animate-slide-up">
      {/* Back button */}
      <Link
        href="/teacher"
        id="back-to-teacher"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "gap-2 text-sm text-muted-foreground hover:text-foreground w-fit"
        )}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Class Overview
      </Link>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
            <BookPlus className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold">Create New Course</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Define the course title and subject department. Next, you&apos;ll build its
          concept prerequisite DAG and add practice questions.
        </p>
      </div>

      {/* Form Container */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6">
        <CreateCourseForm />
      </div>
    </div>
  );
}
