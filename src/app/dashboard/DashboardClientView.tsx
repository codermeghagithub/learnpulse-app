"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { MasteryBar } from "@/components/mastery/MasteryBar";
import { RiskBadge } from "@/components/risk/RiskBadge";
import { MasteryExplainerModal } from "@/components/mastery/MasteryExplainerModal";
import { getAccuracyText } from "@/lib/masteryLevels";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Zap,
  Target,
  Sparkles,
  Award,
  ChevronRight,
  Flame,
} from "lucide-react";
import { CourseSelector } from "@/components/CourseSelector";
import type { RiskResult } from "@/lib/algorithms/risk";

interface Course {
  id: string;
  title: string;
  subject?: string;
}

export interface ConceptItem {
  id: string;
  name: string;
  difficulty: string;
  score: number;
  attemptsCount: number;
  correctCount: number;
  hasAttempted: boolean;
  isDue: boolean;
  retentionScore: number;
  risk: RiskResult;
}

interface DashboardClientViewProps {
  fullName: string;
  validCourses: Course[];
  selectedCourseId: string | null;
  selectedCourse: Course | null;
  validConcepts: { id: string; name: string; difficulty: string; created_at: string }[];
  conceptsWithRisk: ConceptItem[];
  attemptedConcepts: ConceptItem[];
  weakConcepts: ConceptItem[];
  learningHealth: number;
  atRiskCount: number;
}

// Orchestrated spring transitions (Framer / Linear style)
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 24,
      stiffness: 300,
    },
  },
};

export function DashboardClientView({
  fullName,
  validCourses,
  selectedCourseId,
  selectedCourse,
  validConcepts,
  conceptsWithRisk,
  attemptedConcepts,
  weakConcepts,
  learningHealth,
  atRiskCount,
}: DashboardClientViewProps) {
  const firstName = fullName.split(" ")[0] || "Student";
  const completedCount = conceptsWithRisk.filter((c) => c.score >= 80).length;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="px-4 py-6 sm:px-8 sm:py-8 max-w-6xl mx-auto space-y-8"
    >
      {/* ── Top Hero Banner (Linear / Vercel style header + Duolingo engaging flair) ── */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/60 relative"
      >
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/25 backdrop-blur-md shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span>Adaptive Bayesian Engine Active</span>
            <span className="text-muted-foreground/60">&bull;</span>
            <span className="text-[11px] text-primary/80 font-mono">BKT + Spaced Decay</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight flex items-center gap-2.5">
            <span>Good day, {firstName}</span>
            <motion.span
              animate={{ rotate: [0, 14, -10, 14, -4, 10, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 3.5 }}
              className="inline-block origin-bottom-right select-none"
            >
              👋
            </motion.span>
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm max-w-2xl leading-relaxed">
            Continuous prerequisite gap diagnosis and AI-guided spaced retention recovery.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
          <MasteryExplainerModal buttonText="How is Mastery calculated?" variant="button" />
        </div>
      </motion.div>

      {/* ── Course Selector Tabs (Framer style segmented navigation) ── */}
      {validCourses.length > 0 && (
        <motion.div variants={itemVariants}>
          <CourseSelector
            courses={validCourses}
            selectedCourseId={selectedCourseId ?? ""}
            basePath="/dashboard"
          />
        </motion.div>
      )}

      {validConcepts.length === 0 ? (
        /* ── Empty State: Course empty ── */
        <motion.div
          variants={itemVariants}
          className="glass-card rounded-2xl p-12 text-center space-y-5 border-dashed border-2 border-border/80"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-brand glow-brand mx-auto shadow-lg">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">No Concepts Added Yet</h2>
            <p className="text-muted-foreground text-sm mt-2 max-w-sm mx-auto">
              This course does not have any concepts authored yet. Check back soon or switch course.
            </p>
          </div>
        </motion.div>
      ) : (
        <>
          {/* ── First-time Onboarding Card (Duolingo-inspired friendly motivation) ── */}
          {attemptedConcepts.length === 0 && (
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.006 }}
              className="glass-card rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 border-primary/35 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent relative overflow-hidden shadow-lg shadow-primary/5"
            >
              <div className="space-y-1.5 relative z-10">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                  <Sparkles className="h-4 w-4 fill-primary" />
                  Diagnostic Ready
                </div>
                <h3 className="font-bold text-base sm:text-lg text-foreground">
                  Ready to baseline {selectedCourse?.title}?
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
                  Start your first diagnostic practice session to baseline your knowledge graph, detect foundational gaps, and unlock 60-second AI remediation bites.
                </p>
              </div>
              <Link
                href={`/dashboard/practice${selectedCourseId ? `?courseId=${selectedCourseId}` : ""}`}
                id="empty-state-cta"
                className="relative z-10 inline-flex items-center justify-center gap-2 rounded-xl gradient-brand glow-brand text-white px-6 py-3 text-xs sm:text-sm font-semibold hover:opacity-95 transition-all shadow-md active:scale-95 shrink-0 cursor-pointer"
              >
                <Zap className="h-4 w-4" />
                Start Diagnostic Session
              </Link>
            </motion.div>
          )}

          {/* ── Three Key KPI Cards (Linear / Vercel modern metric cards) ── */}
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5"
          >
            {/* 1. Learning Health */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="glass-card card-hover rounded-2xl p-5 sm:p-6 space-y-3.5 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors pointer-events-none" />
              <div className="flex items-center justify-between text-muted-foreground text-xs sm:text-sm font-medium">
                <span className="flex items-center gap-2.5 text-foreground/90 font-semibold">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary shadow-2xs">
                    <TrendingUp className="h-4.5 w-4.5" />
                  </div>
                  Learning Health
                </span>
                <MasteryExplainerModal variant="icon" />
              </div>

              <div className="flex items-baseline gap-2.5 pt-1">
                <div className="text-3xl sm:text-4xl font-extrabold gradient-text tracking-tight">
                  {learningHealth.toFixed(0)}%
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">overall course mastery</span>
              </div>

              <MasteryBar score={learningHealth} showLabel={false} size="sm" />

              <div className="text-xs text-muted-foreground pt-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5 text-orange-500" />
                  <span>{completedCount} mastered (&ge;80%)</span>
                </span>
                <span className="font-mono text-[11px] text-primary font-medium">
                  {((learningHealth / 100) * 5.0).toFixed(1)}/5.0 GPA
                </span>
              </div>
            </motion.div>

            {/* 2. Concepts Tracked */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="glass-card card-hover rounded-2xl p-5 sm:p-6 space-y-3.5 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-colors pointer-events-none" />
              <div className="flex items-center justify-between text-muted-foreground text-xs sm:text-sm font-medium">
                <span className="flex items-center gap-2.5 text-foreground/90 font-semibold">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 shadow-2xs">
                    <Target className="h-4.5 w-4.5" />
                  </div>
                  Concepts Tracked
                </span>
                <div className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground bg-muted/60 px-2.5 py-0.5 rounded-full border border-border/40">
                  DAG Graph
                </div>
              </div>

              <div className="flex items-baseline gap-2.5 pt-1">
                <div className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                  {conceptsWithRisk.length}
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">curriculum nodes</span>
              </div>

              {/* Mini visual ratio bar */}
              <div className="w-full h-1.5 rounded-full bg-muted/60 overflow-hidden flex">
                <div
                  className="h-full bg-indigo-500 transition-all duration-700"
                  style={{
                    width: `${
                      conceptsWithRisk.length > 0
                        ? (attemptedConcepts.length / conceptsWithRisk.length) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>

              <div className="text-xs text-muted-foreground pt-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span><strong>{attemptedConcepts.length}</strong> practiced</span>
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {conceptsWithRisk.length - attemptedConcepts.length} remaining
                </span>
              </div>
            </motion.div>

            {/* 3. At Risk Metric */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className={cn(
                "glass-card card-hover rounded-2xl p-5 sm:p-6 space-y-3.5 relative overflow-hidden group border",
                atRiskCount > 0
                  ? "border-amber-500/40 bg-amber-500/[0.03]"
                  : "border-emerald-500/40 bg-emerald-500/[0.03]"
              )}
            >
              <div className="flex items-center justify-between text-muted-foreground text-xs sm:text-sm font-medium">
                <span className="flex items-center gap-2.5 text-foreground/90 font-semibold">
                  <div
                    className={cn(
                      "p-2 rounded-xl shadow-2xs",
                      atRiskCount > 0
                        ? "bg-amber-500/10 text-amber-500"
                        : "bg-emerald-500/10 text-emerald-500"
                    )}
                  >
                    {atRiskCount > 0 ? (
                      <AlertTriangle className="h-4.5 w-4.5" />
                    ) : (
                      <Award className="h-4.5 w-4.5" />
                    )}
                  </div>
                  Risk Status
                </span>

                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border",
                    atRiskCount > 0
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                      : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                  )}
                >
                  {atRiskCount > 0 ? "Requires Review" : "Optimal Health"}
                </span>
              </div>

              <div className="flex items-baseline gap-2.5 pt-1">
                <div
                  className={cn(
                    "text-3xl sm:text-4xl font-extrabold tracking-tight",
                    atRiskCount > 0
                      ? "text-amber-500 dark:text-amber-400"
                      : "text-emerald-500 dark:text-emerald-400"
                  )}
                >
                  {atRiskCount}
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {atRiskCount === 1 ? "vulnerable concept" : "vulnerable concepts"}
                </span>
              </div>

              <div className="text-xs text-muted-foreground pt-1 flex items-center justify-between">
                <span>
                  {atRiskCount > 0 ? "High error rate / forgetting decay" : "All nodes in safe retention"}
                </span>
                {atRiskCount > 0 && (
                  <span className="text-amber-500 text-[11px] font-semibold flex items-center gap-0.5">
                    Action recommended
                  </span>
                )}
              </div>
            </motion.div>
          </motion.div>

          {/* ── Weak Concepts: Needing Attention Grid (Linear / Duolingo focus cards) ── */}
          {weakConcepts.length > 0 && (
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                  </span>
                  <h2 className="font-bold text-base sm:text-lg tracking-tight">
                    Concepts Needing Attention
                  </h2>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 font-semibold shadow-2xs">
                  {weakConcepts.length} concept{weakConcepts.length > 1 ? "s" : ""} below 60%
                </span>
              </div>

              <motion.div
                variants={containerVariants}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {weakConcepts.map((concept, idx) => (
                  <motion.div
                    key={concept.id}
                    variants={itemVariants}
                    whileHover={{ y: -3, transition: { duration: 0.2 } }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Link
                      href={`/dashboard/gaps/${concept.id}`}
                      id={`concept-card-${idx}`}
                      className="group block glass-card rounded-2xl p-5 border border-border/80 hover:border-primary/50 transition-all duration-200 space-y-3.5 relative overflow-hidden shadow-xs hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="font-semibold text-sm sm:text-base group-hover:text-primary transition-colors line-clamp-1 flex items-center gap-2">
                            <span>{concept.name}</span>
                          </span>
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono bg-muted/70 px-2 py-0.5 rounded border border-border/40">
                            {concept.difficulty}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <RiskBadge bucket={concept.risk.bucket} />
                          <div className="p-1 rounded-lg text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-200 bg-muted/40">
                            <ArrowRight className="h-4 w-4" />
                          </div>
                        </div>
                      </div>

                      <MasteryBar
                        score={concept.score}
                        attemptsCount={concept.attemptsCount}
                        correctCount={concept.correctCount}
                        showLabel={true}
                        size="sm"
                        isDue={concept.isDue}
                      />

                      <div className="text-[11px] text-muted-foreground font-medium pt-2 border-t border-border/40 flex items-center justify-between">
                        <span>{getAccuracyText(concept.correctCount, concept.attemptsCount, concept.score)}</span>
                        <span className="text-primary font-semibold group-hover:underline flex items-center gap-1">
                          Diagnose gap
                          <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}

          {/* ── All Concepts List (Linear table-card rows with micro-interactions) ── */}
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base sm:text-lg tracking-tight">All Concepts</h2>
              </div>
              <span className="text-xs text-muted-foreground font-medium bg-muted/50 px-2.5 py-1 rounded-full border border-border/40">
                {conceptsWithRisk.length} concepts total
              </span>
            </div>

            <motion.div variants={containerVariants} className="space-y-3">
              {conceptsWithRisk.map((concept, idx) => (
                <motion.div
                  key={concept.id}
                  variants={itemVariants}
                  whileHover={{ x: 4, transition: { duration: 0.15 } }}
                  whileTap={{ scale: 0.995 }}
                >
                  <Link
                    href={`/dashboard/gaps/${concept.id}`}
                    id={`all-concept-${idx}`}
                    className="group block glass-card rounded-xl p-4 sm:p-4.5 border border-border/80 hover:border-primary/50 transition-all duration-200 space-y-2.5 shadow-2xs hover:shadow-xs cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-2 w-2 rounded-full bg-primary/40 group-hover:bg-primary group-hover:scale-125 transition-all shrink-0" />
                        <span className="font-medium text-sm sm:text-base group-hover:text-primary transition-colors truncate">
                          {concept.name}
                        </span>
                        <span className="hidden sm:inline-block text-[10px] uppercase tracking-wider text-muted-foreground font-mono px-2 py-0.5 rounded bg-muted/70 border border-border/40">
                          {concept.difficulty}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <RiskBadge bucket={concept.risk.bucket} />
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-200" />
                      </div>
                    </div>

                    <MasteryBar
                      score={concept.score}
                      attemptsCount={concept.attemptsCount}
                      correctCount={concept.correctCount}
                      showLabel={true}
                      size="sm"
                      isDue={concept.isDue}
                    />

                    <div className="text-[11px] text-muted-foreground font-medium flex items-center justify-between pt-0.5">
                      <span>{getAccuracyText(concept.correctCount, concept.attemptsCount, concept.score)}</span>
                      <span className="text-muted-foreground group-hover:text-primary transition-colors text-[10px] flex items-center gap-1">
                        Analyze prerequisite tree
                        <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
