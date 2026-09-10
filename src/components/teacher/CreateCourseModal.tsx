"use client";

import { useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Sparkles,
  BookPlus,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  BrainCircuit,
  Layers,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { QuickCourseSynthesizer } from "./QuickCourseSynthesizer";

export function CreateCourseModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"choose" | "ai">("choose");

  function handleOpen() {
    setMode("choose");
    setIsOpen(true);
  }

  function handleClose() {
    setIsOpen(false);
    setMode("choose");
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) setMode("choose");
      }}
    >
      {/* Trigger Button on Class Overview */}
      <DialogTrigger
        type="button"
        id="create-course-header-btn"
        onClick={handleOpen}
        className={cn(
          buttonVariants(),
          "gap-2 rounded-md font-bold text-sm self-start sm:self-auto border-2 border-border shadow-[2px_2px_0px_var(--shadow-color)] hover:shadow-[3px_3px_0px_var(--shadow-color)] cursor-pointer"
        )}
      >
        <GraduationCap className="h-4 w-4" />
        New Class
      </DialogTrigger>

      {/* Modal Dialog Content */}
      <DialogContent
        showCloseButton={true}
        className={cn(
          "w-full rounded-xl border-2 border-border bg-card text-card-foreground shadow-[4px_4px_0px_var(--shadow-color)] transition-all duration-200 z-50 overflow-hidden sm:max-w-none",
          mode === "choose"
            ? "max-w-2xl sm:max-w-2xl p-6 sm:p-8"
            : "max-w-3xl sm:max-w-3xl p-6 sm:p-7 max-h-[92vh] overflow-y-auto",
        )}
      >
        {/* Top Bar Navigation */}
        <div className="flex items-center justify-between mb-6 pr-6">
          {mode === "ai" ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setMode("choose")}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer h-8 px-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Creation Options
            </Button>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xs text-xs font-bold bg-primary/10 text-primary border-2 border-border shadow-[1px_1px_0px_var(--shadow-color)]">
              <GraduationCap className="h-3.5 w-3.5" />
              Course Creation Studio
            </div>
          )}
        </div>

        {/* View 1: Choice Screen ("Create manually" vs "Create with AI") */}
        {mode === "choose" && (
          <div className="space-y-6">
            <div className="space-y-1.5">
              <h2
                id="modal-title"
                className="text-xl sm:text-2xl font-bold tracking-tight text-foreground"
              >
                How would you like to create your course?
              </h2>
              <p className="text-sm text-muted-foreground">
                Select how you want to define course content, structure
                prerequisite graphs, and generate practice questions.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Option A: Create with AI */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setMode("ai")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setMode("ai");
                  }
                }}
                className="group relative flex flex-col justify-between rounded-xl border-2 border-border hover:border-primary bg-card p-5 transition-all duration-200 cursor-pointer text-left shadow-[2px_2px_0px_var(--shadow-color)] hover:shadow-[4px_4px_0px_var(--shadow-color)] focus:outline-none"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent-yellow/20 text-foreground border-2 border-border shadow-[1px_1px_0px_var(--shadow-color)]">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <Badge
                      variant="secondary"
                      className="gap-1 text-[10px] font-bold bg-primary/15 text-primary border-1.5 border-border rounded-xs"
                    >
                      Recommended
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                      Create with AI
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed font-medium">
                      Paste any academic subject or syllabus. AI automatically
                      synthesizes the complete prerequisite DAG and 4–5
                      diagnostic questions per concept.
                    </p>
                  </div>

                  <ul className="space-y-2 text-xs text-muted-foreground font-medium pt-3 border-t-2 border-border/40">
                    <li className="flex items-center gap-2">
                      <BrainCircuit className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>Zero manual graph charting</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <HelpCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>4–5 graded MCQs per concept (easy → hard)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>Full draft review before saving to DB</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4 mt-2">
                  <Button
                    type="button"
                    tabIndex={-1}
                    className="w-full text-xs font-bold gap-1.5 shadow-[2px_2px_0px_var(--shadow-color)] pointer-events-none rounded-md"
                  >
                    Synthesize with AI
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </div>
              </div>

              {/* Option B: Create Manually */}
              <Link
                href="/teacher/courses/new"
                onClick={handleClose}
                className="group relative flex flex-col justify-between rounded-xl border-2 border-border hover:border-foreground/60 bg-card p-5 transition-all duration-200 text-left shadow-[2px_2px_0px_var(--shadow-color)] hover:shadow-[4px_4px_0px_var(--shadow-color)] focus:outline-none"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent-blue/20 text-foreground border-2 border-border shadow-[1px_1px_0px_var(--shadow-color)]">
                      <BookPlus className="h-5 w-5 text-primary" />
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-bold bg-muted text-foreground border-1.5 border-border rounded-xs"
                    >
                      Manual Setup
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                      Create Manually
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Define your course title and subject department, then
                      manually construct concepts, prerequisite dependencies,
                      and questions step-by-step.
                    </p>
                  </div>

                  <ul className="space-y-2 text-xs text-muted-foreground pt-3 border-t border-border">
                    <li className="flex items-center gap-2">
                      <Layers className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>Custom course metadata & department</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>Manual concept & dependency ordering</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>Direct authoring in Curriculum Editor</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4 mt-2">
                  <div className="w-full py-2.5 px-3 rounded-xl border border-border bg-card group-hover:bg-muted/60 text-foreground text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors shadow-xs">
                    Continue Manually
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* View 2: Embedded AI Course Synthesizer */}
        {mode === "ai" && (
          <div className="space-y-4">
            <QuickCourseSynthesizer isModal onClose={handleClose} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
