"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  GraduationCap,
  Sparkles,
  BookPlus,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  BrainCircuit,
  Layers,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { QuickCourseSynthesizer } from "./QuickCourseSynthesizer";

export function CreateCourseModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"choose" | "ai">("choose");

  // Close on Escape key & manage body scroll
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
        setMode("choose");
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  function handleOpen() {
    setMode("choose");
    setIsOpen(true);
  }

  function handleClose() {
    setIsOpen(false);
    setMode("choose");
  }

  return (
    <>
      {/* Trigger Button on Class Overview */}
      <button
        type="button"
        id="create-course-header-btn"
        onClick={handleOpen}
        className="inline-flex items-center gap-2 rounded-xl gradient-brand glow-brand text-white px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity self-start sm:self-auto shadow-sm cursor-pointer"
      >
        <GraduationCap className="h-4 w-4" />
        Create Course
      </button>

      {/* Modal Dialog via Portal */}
      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) handleClose();
            }}
          >
            <div className={cn(
              "relative w-full rounded-2xl border border-border/80 bg-[#0d121f] text-foreground shadow-2xl transition-all duration-200 animate-scale-up z-50 overflow-hidden",
              mode === "choose" ? "max-w-2xl p-6 sm:p-8" : "max-w-3xl p-6 sm:p-7 max-h-[92vh] overflow-y-auto"
            )}>
              {/* Top Bar / Close Button */}
              <div className="flex items-center justify-between mb-6">
                {mode === "ai" ? (
                  <button
                    type="button"
                    onClick={() => setMode("choose")}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted/50 cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Creation Options
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                    <GraduationCap className="h-3.5 w-3.5" />
                    Course Creation Studio
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleClose}
                  className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors ml-auto cursor-pointer"
                  aria-label="Close dialog"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* View 1: Choice Screen ("Create manually" vs "Create with AI") */}
              {mode === "choose" && (
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <h2 id="modal-title" className="text-xl sm:text-2xl font-bold tracking-tight">
                      How would you like to create your course?
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Select how you want to define course content, structure prerequisite graphs, and generate practice questions.
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
                      className="group relative flex flex-col justify-between rounded-2xl border-2 border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 p-5 transition-all duration-200 cursor-pointer text-left shadow-sm hover:shadow-primary/10 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-brand text-white shadow-sm">
                            <Sparkles className="h-5 w-5" />
                          </div>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                            Recommended
                          </span>
                        </div>

                        <div>
                          <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                            Create with AI
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            Paste any academic subject or syllabus. AI automatically synthesizes the complete prerequisite DAG and 4–5 diagnostic questions per concept.
                          </p>
                        </div>

                        <ul className="space-y-1.5 text-xs text-muted-foreground pt-1 border-t border-primary/20">
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
                        <button
                          type="button"
                          tabIndex={-1}
                          className="w-full py-2.5 px-3 rounded-xl gradient-brand text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 shadow-sm group-hover:opacity-95 pointer-events-none"
                        >
                          Synthesize with AI
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </button>
                      </div>
                    </div>

                    {/* Option B: Create Manually */}
                    <Link
                      href="/teacher/courses/new"
                      onClick={handleClose}
                      className="group relative flex flex-col justify-between rounded-2xl border border-border/80 hover:border-border bg-background/40 hover:bg-background/70 p-5 transition-all duration-200 text-left shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-foreground border border-border shadow-sm">
                            <BookPlus className="h-5 w-5" />
                          </div>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                            Manual Setup
                          </span>
                        </div>

                        <div>
                          <h3 className="font-bold text-base text-foreground group-hover:text-foreground transition-colors flex items-center gap-1.5">
                            Create Manually
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            Define your course title and subject department, then manually construct concepts, prerequisite dependencies, and questions step-by-step.
                          </p>
                        </div>

                        <ul className="space-y-1.5 text-xs text-muted-foreground pt-1 border-t border-border/60">
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
                        <div className="w-full py-2.5 px-3 rounded-xl border border-border/80 bg-background/60 group-hover:bg-background text-foreground text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors">
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
                  <QuickCourseSynthesizer
                    isModal
                    onClose={handleClose}
                  />
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
