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
  Compass,
  Plus,
} from "lucide-react";
import { CourseSelector } from "@/components/CourseSelector";
import type { RiskResult } from "@/lib/algorithms/risk";

import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  validConcepts: {
    id: string;
    name: string;
    difficulty: string;
    created_at: string;
  }[];
  conceptsWithRisk: ConceptItem[];
  attemptedConcepts: ConceptItem[];
  weakConcepts: ConceptItem[];
  learningHealth: number;
  atRiskCount: number;
  totalPlatformCoursesCount?: number;
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
  totalPlatformCoursesCount = 0,
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
      {/* ── Top Hero Banner ── */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/60 relative"
      >
        <div className="space-y-1.5">
          <Badge variant="outline" className="gap-2 px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary border-primary/20 h-auto">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span>Bayesian Knowledge Tracing active</span>
            <span className="text-muted-foreground/60">&bull;</span>
            <span className="text-[11px] text-muted-foreground font-mono">
              Spaced decay enabled
            </span>
          </Badge>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Good day, {firstName}
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm max-w-2xl leading-relaxed">
            Continuous prerequisite gap diagnosis and AI-guided spaced retention
            recovery.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
          <MasteryExplainerModal
            buttonText="How is Mastery calculated?"
            variant="button"
          />
        </div>
      </motion.div>

      {/* ── Course Selector Tabs ── */}
      {validCourses.length > 0 && (
        <motion.div variants={itemVariants}>
          <CourseSelector
            courses={validCourses}
            selectedCourseId={selectedCourseId ?? ""}
            basePath="/dashboard"
          />
        </motion.div>
      )}

      {validCourses.length === 0 ? (
        totalPlatformCoursesCount > 0 ? (
          /* ── Empty State: Student has not enrolled in any course yet ── */
          <motion.div
            variants={itemVariants}
            className="glass-card rounded-2xl p-10 sm:p-14 text-center space-y-6 border-dashed border-2 border-primary/30 bg-primary/2"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 mx-auto shadow-sm">
              <Compass className="h-8 w-8" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                Choose Your Courses to Get Started
              </h2>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                You have the freedom to enroll in courses of your choice. Once
                you enroll, LearnPulse will begin tracking your concept mastery
                and retention.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/dashboard/courses"
                id="empty-state-browse-catalog-btn"
                className={cn(
                  buttonVariants(),
                  "gap-2 rounded-xl px-6 py-3 text-xs sm:text-sm font-semibold shadow-sm cursor-pointer h-11"
                )}
              >
                <Plus className="h-4 w-4" />
                Browse Course Catalog ({totalPlatformCoursesCount} available)
              </Link>
            </div>
          </motion.div>
        ) : (
          /* ── Empty State: No courses published on platform yet ── */
          <motion.div
            variants={itemVariants}
            className="glass-card rounded-2xl p-12 text-center space-y-5 border-dashed border-2 border-border/80"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 mx-auto shadow-sm">
              <BookOpen className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                No courses available yet
              </h2>
              <p className="text-muted-foreground text-sm mt-2 max-w-sm mx-auto">
                Your instructor has not created or published any courses yet.
                Once courses are created, you will see them in the course
                catalog.
              </p>
            </div>
          </motion.div>
        )
      ) : validConcepts.length === 0 ? (
        /* ── Empty State: Course empty ── */
        <motion.div
          variants={itemVariants}
          className="glass-card rounded-2xl p-12 text-center space-y-5 border-dashed border-2 border-border/80"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 mx-auto shadow-sm">
            <BookOpen className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              No concepts added yet
            </h2>
            <p className="text-muted-foreground text-sm mt-2 max-w-sm mx-auto">
              This course does not have any concepts authored yet. Check back
              soon or switch course.
            </p>
          </div>
        </motion.div>
      ) : (
        <>
          {/* ── First-time Onboarding Card ── */}
          {attemptedConcepts.length === 0 && (
            <motion.div
              variants={itemVariants}
              className="glass-card rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 border-primary/25 bg-primary/5 relative overflow-hidden shadow-sm"
            >
              <div className="space-y-1.5 relative z-10">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <Sparkles className="h-4 w-4" />
                  Diagnostic ready
                </div>
                <h3 className="font-semibold text-base sm:text-lg text-foreground">
                  Ready to baseline {selectedCourse?.title}?
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
                  Start your first diagnostic practice session to baseline your
                  knowledge graph, detect foundational gaps, and unlock
                  60-second AI remediation bites.
                </p>
              </div>
              <Link
                href={`/dashboard/practice${selectedCourseId ? `?courseId=${selectedCourseId}` : ""}`}
                id="empty-state-cta"
                className={cn(
                  buttonVariants(),
                  "relative z-10 gap-2 rounded-xl px-6 py-3 text-xs sm:text-sm font-semibold shadow-sm shrink-0 cursor-pointer h-11"
                )}
              >
                <Zap className="h-4 w-4" />
                Start Diagnostic Session
              </Link>
            </motion.div>
          )}

          {/* ── Three Key KPI Cards ── */}
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5"
          >
            {/* 1. Learning Health */}
            <motion.div
              variants={itemVariants}
              className="glass-card rounded-2xl p-5 sm:p-6 space-y-3.5 relative overflow-hidden"
            >
              <div className="flex items-center justify-between text-muted-foreground text-xs sm:text-sm font-medium">
                <span className="flex items-center gap-2.5 text-foreground font-semibold">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  Learning Health
                </span>
                <MasteryExplainerModal variant="icon" />
              </div>

              <div className="flex items-baseline gap-2.5 pt-1">
                <div className="text-3xl sm:text-4xl font-display font-semibold tracking-tight text-foreground tabular-nums">
                  {learningHealth.toFixed(0)}%
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">
                  overall course mastery
                </span>
              </div>

              <MasteryBar score={learningHealth} showLabel={false} size="sm" />

              <div className="text-xs text-muted-foreground pt-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5 text-orange-500" />
                  <span>{completedCount} mastered (&ge;80%)</span>
                </span>
                <span className="font-display tabular-nums text-[11px] text-primary font-semibold">
                  {((learningHealth / 100) * 5.0).toFixed(1)}/5.0 GPA
                </span>
              </div>
            </motion.div>

            {/* 2. Concepts Tracked */}
            <motion.div
              variants={itemVariants}
              className="glass-card rounded-2xl p-5 sm:p-6 space-y-3.5 relative overflow-hidden"
            >
              <div className="flex items-center justify-between text-muted-foreground text-xs sm:text-sm font-medium">
                <span className="flex items-center gap-2.5 text-foreground font-semibold">
                  <div className="p-2 rounded-xl bg-muted text-foreground">
                    <Target className="h-4 w-4" />
                  </div>
                  Concepts Tracked
                </span>
                <Badge variant="outline" className="text-[10px] font-medium tracking-wide text-muted-foreground bg-muted/60 px-2 py-0.5 border-border/40">
                  Prerequisite Graph
                </Badge>
              </div>

              <div className="flex items-baseline gap-2.5 pt-1">
                <div className="text-3xl sm:text-4xl font-display font-semibold tracking-tight text-foreground tabular-nums">
                  {conceptsWithRisk.length}
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">
                  curriculum nodes
                </span>
              </div>

              {/* Mini visual ratio bar */}
              <div className="w-full h-1.5 rounded-full bg-muted/60 overflow-hidden flex">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{
                    width: `${
                      conceptsWithRisk.length > 0
                        ? (attemptedConcepts.length / conceptsWithRisk.length) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>

              <div className="text-xs text-muted-foreground pt-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  <span>
                    <strong>{attemptedConcepts.length}</strong> practiced
                  </span>
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {conceptsWithRisk.length - attemptedConcepts.length} remaining
                </span>
              </div>
            </motion.div>

            {/* 3. At Risk Metric */}
            <motion.div
              variants={itemVariants}
              className={cn(
                "glass-card rounded-2xl p-5 sm:p-6 space-y-3.5 relative overflow-hidden border",
                atRiskCount > 0
                  ? "border-warning/30 bg-warning/[0.03]"
                  : "border-success/30 bg-success/[0.03]",
              )}
            >
              <div className="flex items-center justify-between text-muted-foreground text-xs sm:text-sm font-medium">
                <span className="flex items-center gap-2.5 text-foreground font-semibold">
                  <div
                    className={cn(
                      "p-2 rounded-xl",
                      atRiskCount > 0
                        ? "bg-warning/10 text-warning"
                        : "bg-success/10 text-success",
                    )}
                  >
                    {atRiskCount > 0 ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : (
                      <Award className="h-4 w-4" />
                    )}
                  </div>
                  Risk Status
                </span>

                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-medium px-2 py-0.5",
                    atRiskCount > 0
                      ? "bg-warning/15 text-warning border-warning/30"
                      : "bg-success/15 text-success border-success/30",
                  )}
                >
                  {atRiskCount > 0 ? "Requires review" : "Optimal health"}
                </Badge>
              </div>

              <div className="flex items-baseline gap-2.5 pt-1">
                <div
                  className={cn(
                    "text-3xl sm:text-4xl font-display font-semibold tracking-tight tabular-nums",
                    atRiskCount > 0 ? "text-warning" : "text-success",
                  )}
                >
                  {atRiskCount}
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {atRiskCount === 1
                    ? "vulnerable concept"
                    : "vulnerable concepts"}
                </span>
              </div>

              <div className="text-xs text-muted-foreground pt-1 flex items-center justify-between">
                <span>
                  {atRiskCount > 0
                    ? "High error rate or forgetting decay"
                    : "All nodes in safe retention"}
                </span>
                {atRiskCount > 0 && (
                  <span className="text-warning text-[11px] font-medium flex items-center gap-0.5">
                    Action recommended
                  </span>
                )}
              </div>
            </motion.div>
          </motion.div>

          {/* ── Weak Concepts: Needing Attention Grid ── */}
          {weakConcepts.length > 0 && (
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 rounded-full bg-warning" />
                  <h2 className="font-semibold text-base sm:text-lg tracking-tight text-foreground">
                    Concepts needing attention
                  </h2>
                </div>
                <Badge variant="outline" className="text-xs px-2.5 py-0.5 bg-warning/10 text-warning border-warning/20 font-medium">
                  {weakConcepts.length} concept
                  {weakConcepts.length > 1 ? "s" : ""} below 60%
                </Badge>
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
                          <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono bg-muted/70 px-2 py-0.5 border-border/40">
                            {concept.difficulty}
                          </Badge>
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
                        <span>
                          {getAccuracyText(
                            concept.correctCount,
                            concept.attemptsCount,
                            concept.score,
                          )}
                        </span>
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

          {/* ── All Concepts List ── */}
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-base sm:text-lg tracking-tight text-foreground">
                  All curriculum concepts
                </h2>
              </div>
              <Badge variant="outline" className="text-xs text-muted-foreground font-medium bg-muted/50 px-2.5 py-0.5 border-border/40 font-mono">
                {conceptsWithRisk.length} concepts
              </Badge>
            </div>

            <motion.div variants={containerVariants} className="space-y-3">
              {conceptsWithRisk.map((concept, idx) => (
                <motion.div key={concept.id} variants={itemVariants}>
                  <Link
                    href={`/dashboard/gaps/${concept.id}`}
                    id={`all-concept-${idx}`}
                    className="group block glass-card rounded-xl p-4 sm:p-4.5 border border-border hover:border-primary/50 transition-colors space-y-2.5 shadow-xs cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-2 w-2 rounded-full bg-primary/40 group-hover:bg-primary transition-colors shrink-0" />
                        <span className="font-medium text-sm sm:text-base group-hover:text-primary transition-colors truncate text-foreground">
                          {concept.name}
                        </span>
                        <Badge variant="outline" className="hidden sm:inline-flex text-[10px] uppercase tracking-wider text-muted-foreground font-mono px-2 py-0.5 bg-muted/70 border-border/40">
                          {concept.difficulty}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <RiskBadge bucket={concept.risk.bucket} />
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-transform" />
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
                      <span>
                        {getAccuracyText(
                          concept.correctCount,
                          concept.attemptsCount,
                          concept.score,
                        )}
                      </span>
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
