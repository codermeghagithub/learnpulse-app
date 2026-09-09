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

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
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
      stiffness: 280,
    },
  },
};

const cardHoverVariants = {
  initial: { y: 0, scale: 1 },
  hover: {
    y: -3,
    scale: 1.008,
    transition: { type: "spring", stiffness: 400, damping: 20 },
  },
  tap: { scale: 0.99 },
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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="px-4 py-6 sm:px-8 sm:py-8 max-w-5xl mx-auto space-y-8"
    >
      {/* Page Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/60 relative"
      >
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 backdrop-blur-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            Adaptive Diagnostics Active
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            Good day, {firstName}
            <motion.span
              animate={{ rotate: [0, 14, -10, 14, -4, 10, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 3 }}
              className="inline-block origin-bottom-right"
            >
              👋
            </motion.span>
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Continuous Bayesian mastery tracking and prerequisite gap synthesis.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <MasteryExplainerModal buttonText="How is Mastery calculated?" variant="button" />
        </div>
      </motion.div>

      {/* Course Selector Tabs */}
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
        /* ── Empty state: No concepts in course ── */
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
          {/* Welcome CTA when nothing attempted yet */}
          {attemptedConcepts.length === 0 && (
            <motion.div
              variants={itemVariants}
              className="glass-card rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent relative overflow-hidden shadow-lg shadow-primary/5"
            >
              <div className="space-y-1.5 relative z-10">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <Sparkles className="h-4 w-4 fill-primary" />
                  Diagnostic Baseline
                </div>
                <h3 className="font-bold text-base text-foreground">
                  Welcome to {selectedCourse?.title}!
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
                  Start your first diagnostic practice session to baseline your mastery, discover prerequisite gaps, and unlock AI remediation bites.
                </p>
              </div>
              <Link
                href={`/dashboard/practice${selectedCourseId ? `?courseId=${selectedCourseId}` : ""}`}
                id="empty-state-cta"
                className="relative z-10 inline-flex items-center justify-center gap-2 rounded-xl gradient-brand glow-brand text-white px-5 py-2.5 text-xs sm:text-sm font-semibold hover:opacity-95 transition-all shadow-md active:scale-95 shrink-0 cursor-pointer"
              >
                <Zap className="h-4 w-4" />
                Start Practicing
              </Link>
            </motion.div>
          )}

          {/* ── Stats Row with Framer Motion ── */}
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5"
          >
            {/* Learning Health */}
            <motion.div
              variants={itemVariants}
              whileHover="hover"
              initial="initial"
              custom={cardHoverVariants}
              className="glass-card card-hover rounded-2xl p-5 sm:p-6 space-y-3.5 relative overflow-hidden group border border-border/80"
            >
              <div className="absolute top-0 right-0 w-28 h-28 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/15 transition-colors pointer-events-none" />
              <div className="flex items-center justify-between text-muted-foreground text-xs sm:text-sm font-medium">
                <span className="flex items-center gap-2 text-foreground/90 font-semibold">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary shadow-2xs">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  Learning Health
                </span>
                <MasteryExplainerModal variant="icon" />
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl sm:text-4xl font-extrabold gradient-text tracking-tight">
                  {learningHealth.toFixed(0)}%
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">overall course mastery</span>
              </div>
              <MasteryBar score={learningHealth} showLabel={false} size="sm" />
            </motion.div>

            {/* Concepts Tracked */}
            <motion.div
              variants={itemVariants}
              whileHover="hover"
              initial="initial"
              custom={cardHoverVariants}
              className="glass-card card-hover rounded-2xl p-5 sm:p-6 space-y-3.5 relative overflow-hidden group border border-border/80"
            >
              <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/15 transition-colors pointer-events-none" />
              <div className="flex items-center justify-between text-muted-foreground text-xs sm:text-sm font-medium">
                <span className="flex items-center gap-2 text-foreground/90 font-semibold">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 shadow-2xs">
                    <Target className="h-4 w-4" />
                  </div>
                  Concepts Tracked
                </span>
                <div className="text-[11px] font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                  DAG Verified
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                  {conceptsWithRisk.length}
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">in this course</span>
              </div>
              <div className="text-xs text-muted-foreground pt-1 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  <strong>{attemptedConcepts.length}</strong> practiced &bull; {conceptsWithRisk.length - attemptedConcepts.length} pending
                </span>
              </div>
            </motion.div>

            {/* At Risk Metric */}
            <motion.div
              variants={itemVariants}
              whileHover="hover"
              initial="initial"
              custom={cardHoverVariants}
              className={cn(
                "glass-card card-hover rounded-2xl p-5 sm:p-6 space-y-3.5 relative overflow-hidden group border",
                atRiskCount > 0
                  ? "border-amber-500/40 bg-amber-500/[0.03]"
                  : "border-emerald-500/40 bg-emerald-500/[0.03]"
              )}
            >
              <div className="flex items-center justify-between text-muted-foreground text-xs sm:text-sm font-medium">
                <span className="flex items-center gap-2 text-foreground/90 font-semibold">
                  <div
                    className={cn(
                      "p-2 rounded-xl shadow-2xs",
                      atRiskCount > 0
                        ? "bg-amber-500/10 text-amber-500"
                        : "bg-emerald-500/10 text-emerald-500"
                    )}
                  >
                    {atRiskCount > 0 ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : (
                      <Award className="h-4 w-4" />
                    )}
                  </div>
                  At Risk
                </span>
                <span
                  className={cn(
                    "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                    atRiskCount > 0
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  {atRiskCount > 0 ? "Requires Review" : "Optimal"}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
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
                  {atRiskCount === 1 ? "concept needs attention" : "concepts need attention"}
                </span>
              </div>
              <div className="text-xs text-muted-foreground pt-1">
                {atRiskCount > 0
                  ? "High error rate or forgetting decay detected"
                  : "All practiced concepts in healthy mastery range"}
              </div>
            </motion.div>
          </motion.div>

          {/* ── Weak Concepts Needing Attention ── */}
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
                <span className="text-xs px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-semibold shadow-2xs">
                  {weakConcepts.length} concept{weakConcepts.length > 1 ? "s" : ""} below 60%
                </span>
              </div>

              <motion.div
                variants={containerVariants}
                className="grid grid-cols-1 md:grid-cols-2 gap-3.5"
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
                      className="group block glass-card rounded-xl p-4 sm:p-5 border border-border/80 hover:border-primary/50 transition-all duration-200 space-y-3 relative overflow-hidden shadow-xs hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <span className="font-semibold text-sm sm:text-base group-hover:text-primary transition-colors line-clamp-1">
                            {concept.name}
                          </span>
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono bg-muted/60 px-1.5 py-0.5 rounded">
                            {concept.difficulty}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <RiskBadge bucket={concept.risk.bucket} />
                          <div className="p-1 rounded-md text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-200">
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
                      <div className="text-[11px] text-muted-foreground font-medium pt-1 border-t border-border/40 flex items-center justify-between">
                        <span>{getAccuracyText(concept.correctCount, concept.attemptsCount, concept.score)}</span>
                        <span className="text-primary font-semibold group-hover:underline">
                          Diagnose gap &rarr;
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}

          {/* ── All Concepts ── */}
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base sm:text-lg tracking-tight">All Concepts</h2>
              <span className="text-xs text-muted-foreground font-medium">
                {conceptsWithRisk.length} concepts total
              </span>
            </div>

            <motion.div variants={containerVariants} className="space-y-3">
              {conceptsWithRisk.map((concept, idx) => (
                <motion.div
                  key={concept.id}
                  variants={itemVariants}
                  whileHover={{ x: 3, transition: { duration: 0.15 } }}
                  whileTap={{ scale: 0.995 }}
                >
                  <Link
                    href={`/dashboard/gaps/${concept.id}`}
                    id={`all-concept-${idx}`}
                    className="group block glass-card rounded-xl p-4 sm:p-4.5 border border-border/80 hover:border-primary/50 transition-all duration-200 space-y-2.5 shadow-2xs hover:shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-2 w-2 rounded-full bg-primary/40 group-hover:bg-primary group-hover:scale-125 transition-all shrink-0" />
                        <span className="font-medium text-sm sm:text-base group-hover:text-primary transition-colors truncate">
                          {concept.name}
                        </span>
                        <span className="hidden sm:inline-block text-[10px] uppercase tracking-wider text-muted-foreground font-mono px-1.5 py-0.5 rounded bg-muted">
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
                    <div className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
                      <span>{getAccuracyText(concept.correctCount, concept.attemptsCount, concept.score)}</span>
                      <span className="text-muted-foreground group-hover:text-primary transition-colors text-[10px]">
                        Click to analyze tree &rarr;
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
