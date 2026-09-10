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
      className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8"
    >
      {/* ── Top Hero Banner ── */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b-2 border-border/40 relative"
      >
        <div className="space-y-1.5 min-w-0 flex-1">
          <Badge variant="outline" className="gap-2 px-3 py-1 text-xs font-bold bg-primary text-primary-foreground border-2 border-border shadow-[2px_2px_0px_var(--shadow-color)] h-auto rounded-xs">
            <span className="h-2 w-2 rounded-xs bg-white" />
            <span>Smart Learning Active</span>
            <span className="opacity-60">&bull;</span>
            <span className="text-[11px] font-mono opacity-90">
              Personalized Practice
            </span>
          </Badge>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Good day, {firstName}
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm max-w-2xl leading-relaxed font-medium">
            Find out what you know, review tricky questions, and build confidence with quick practice.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto shrink-0">
          <MasteryExplainerModal
            buttonText="How do these scores work?"
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
            className="rounded-xl p-10 sm:p-14 text-center space-y-6 border-2 border-dashed border-border bg-card shadow-[2px_2px_0px_var(--shadow-color)]"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-md bg-accent-blue/20 text-foreground border-2 border-border shadow-[2px_2px_0px_var(--shadow-color)] mx-auto">
              <Compass className="h-7 w-7" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                Choose Your Courses to Get Started
              </h2>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed font-medium">
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
                  "gap-2 rounded-md px-6 py-2.5 text-xs sm:text-sm font-bold border-2 border-border shadow-[2px_2px_0px_var(--shadow-color)] hover:shadow-[3px_3px_0px_var(--shadow-color)] cursor-pointer h-10"
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
            className="rounded-xl p-12 text-center space-y-5 border-2 border-dashed border-border bg-card shadow-[2px_2px_0px_var(--shadow-color)]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-accent-yellow/20 text-foreground border-2 border-border shadow-[2px_2px_0px_var(--shadow-color)] mx-auto">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                No courses available yet
              </h2>
              <p className="text-muted-foreground text-sm mt-2 max-w-sm mx-auto font-medium">
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
          className="rounded-xl p-12 text-center space-y-5 border-2 border-dashed border-border bg-card shadow-[2px_2px_0px_var(--shadow-color)]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted text-foreground border-2 border-border shadow-[2px_2px_0px_var(--shadow-color)] mx-auto">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              No concepts added yet
            </h2>
            <p className="text-muted-foreground text-sm mt-2 max-w-sm mx-auto font-medium">
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
              className="rounded-xl p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 border-2 border-border bg-card shadow-[2px_2px_0px_var(--shadow-color)] relative overflow-hidden"
            >
              <div className="space-y-1.5 relative z-10">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                  <Sparkles className="h-4 w-4" />
                  Quiz ready
                </div>
                <h3 className="font-bold text-base sm:text-lg text-foreground">
                  Ready to test your knowledge in {selectedCourse?.title}?
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed font-medium">
                  Take a quick practice quiz to see what you already know, find topics
                  that need review, and get instant explanations.
                </p>
              </div>
              <Link
                href={`/dashboard/practice${selectedCourseId ? `?courseId=${selectedCourseId}` : ""}`}
                id="empty-state-cta"
                className={cn(
                  buttonVariants(),
                  "relative z-10 gap-2 rounded-md px-6 py-2.5 text-xs sm:text-sm font-bold border-2 border-border shadow-[2px_2px_0px_var(--shadow-color)] hover:shadow-[3px_3px_0px_var(--shadow-color)] shrink-0 cursor-pointer h-10"
                )}
              >
                <Zap className="h-4 w-4" />
                Start Practice Quiz
              </Link>
            </motion.div>
          )}

          {/* ── Three Key KPI Cards ── */}
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
          >
            {/* 1. Learning Health */}
            <motion.div
              variants={itemVariants}
              className="rounded-xl p-5 sm:p-6 space-y-3.5 relative overflow-hidden border-2 border-border bg-card shadow-[2px_2px_0px_var(--shadow-color)]"
            >
              <div className="flex items-center justify-between text-muted-foreground text-xs sm:text-sm font-medium">
                <span className="flex items-center gap-2.5 text-foreground font-bold">
                  <div className="p-2 rounded-md bg-accent-yellow/20 text-foreground border-2 border-border shadow-[1px_1px_0px_var(--shadow-color)]">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  Your Score
                </span>
                <MasteryExplainerModal variant="icon" />
              </div>

              <div className="flex items-baseline gap-2.5 pt-1">
                <div className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground tabular-nums">
                  {learningHealth.toFixed(0)}%
                </div>
                <span className="text-[11px] text-muted-foreground font-semibold">
                  overall class score
                </span>
              </div>

              <MasteryBar score={learningHealth} showLabel={false} size="sm" />

              <div className="text-xs text-muted-foreground pt-1 flex items-center justify-between font-medium">
                <span className="flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5 text-primary" />
                  <span>{completedCount} completed (&ge;80%)</span>
                </span>
                <span className="tabular-nums text-[11px] text-primary font-bold">
                  {((learningHealth / 100) * 5.0).toFixed(1)}/5.0 GPA
                </span>
              </div>
            </motion.div>

            {/* 2. Concepts Tracked */}
            <motion.div
              variants={itemVariants}
              className="rounded-xl p-5 sm:p-6 space-y-3.5 relative overflow-hidden border-2 border-border bg-card shadow-[2px_2px_0px_var(--shadow-color)]"
            >
              <div className="flex items-center justify-between text-muted-foreground text-xs sm:text-sm font-medium">
                <span className="flex items-center gap-2.5 text-foreground font-bold">
                  <div className="p-2 rounded-md bg-accent-blue/20 text-foreground border-2 border-border shadow-[1px_1px_0px_var(--shadow-color)]">
                    <Target className="h-4 w-4" />
                  </div>
                  Lessons in Class
                </span>
                <Badge variant="outline" className="text-[10px] font-bold tracking-wide text-muted-foreground bg-muted px-2 py-0.5 border-1.5 border-border rounded-xs">
                  Course Topics
                </Badge>
              </div>

              <div className="flex items-baseline gap-2.5 pt-1">
                <div className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground tabular-nums">
                  {conceptsWithRisk.length}
                </div>
                <span className="text-[11px] text-muted-foreground font-semibold">
                  total topics
                </span>
              </div>

              {/* Mini visual ratio bar */}
              <div className="w-full h-2 rounded-sm bg-muted border-2 border-border overflow-hidden flex">
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

              <div className="text-xs text-muted-foreground pt-1 flex items-center justify-between font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-xs bg-success border border-border" />
                  <span>
                    <strong>{attemptedConcepts.length}</strong> completed
                  </span>
                </span>
                <span className="text-[11px] text-muted-foreground font-semibold">
                  {conceptsWithRisk.length - attemptedConcepts.length} to go
                </span>
              </div>
            </motion.div>

            {/* 3. At Risk Metric */}
            <motion.div
              variants={itemVariants}
              className="rounded-xl p-5 sm:p-6 space-y-3.5 relative overflow-hidden border-2 border-border bg-card shadow-[2px_2px_0px_var(--shadow-color)]"
            >
              <div className="flex items-center justify-between text-muted-foreground text-xs sm:text-sm font-medium">
                <span className="flex items-center gap-2.5 text-foreground font-bold">
                  <div
                    className={cn(
                      "p-2 rounded-md border-2 border-border shadow-[1px_1px_0px_var(--shadow-color)]",
                      atRiskCount > 0
                        ? "bg-accent-yellow/30 text-foreground"
                        : "bg-success/20 text-success",
                    )}
                  >
                    {atRiskCount > 0 ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : (
                      <Award className="h-4 w-4" />
                    )}
                  </div>
                  Needs Review
                </span>

                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-bold px-2.5 py-0.5 rounded-xs border-1.5",
                    atRiskCount > 0
                      ? "bg-accent-yellow text-black border-border shadow-[1px_1px_0px_var(--shadow-color)]"
                      : "bg-success/20 text-success border-success",
                  )}
                >
                  {atRiskCount > 0 ? "Review suggested" : "Doing great"}
                </Badge>
              </div>

              <div className="flex items-baseline gap-2.5 pt-1">
                <div
                  className={cn(
                    "text-3xl sm:text-4xl font-bold tracking-tight tabular-nums",
                    atRiskCount > 0 ? "text-primary" : "text-success",
                  )}
                >
                  {atRiskCount}
                </div>
                <span className="text-[11px] text-muted-foreground font-semibold">
                  {atRiskCount === 1
                    ? "topic needs review"
                    : "topics need review"}
                </span>
              </div>

              <div className="text-xs text-muted-foreground pt-1 flex items-center justify-between font-medium">
                <span>
                  {atRiskCount > 0
                    ? "Missed questions or time to practice again"
                    : "All topics are up to date"}
                </span>
                {atRiskCount > 0 && (
                  <span className="text-primary text-[11px] font-bold flex items-center gap-0.5">
                    Practice now
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
                  <span className="h-2.5 w-2.5 rounded-xs bg-primary border border-border" />
                  <h2 className="font-bold text-base sm:text-lg tracking-tight text-foreground">
                    Topics Needing Practice
                  </h2>
                </div>
                <Badge variant="outline" className="text-xs px-3 py-0.5 bg-accent-yellow/30 text-foreground border-1.5 border-border font-bold rounded-xs">
                  {weakConcepts.length} topic
                  {weakConcepts.length > 1 ? "s" : ""} under 60%
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
                    whileHover={{ y: -2, transition: { duration: 0.15 } }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Link
                      href={`/dashboard/gaps/${concept.id}`}
                      id={`concept-card-${idx}`}
                      className="group block rounded-xl p-5 border-2 border-border bg-card shadow-[2px_2px_0px_var(--shadow-color)] hover:shadow-[4px_4px_0px_var(--shadow-color)] hover:-translate-x-px hover:-translate-y-px transition-all duration-150 space-y-3.5 relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="font-bold text-sm sm:text-base group-hover:text-primary transition-colors line-clamp-1 flex items-center gap-2">
                            <span>{concept.name}</span>
                          </span>
                          <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold bg-muted px-2.5 py-0.5 border-1.5 border-border rounded-xs">
                            {concept.difficulty}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <RiskBadge bucket={concept.risk.bucket} />
                          <div className="p-1.5 rounded-md text-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-150 bg-muted border-1.5 border-border shadow-[1px_1px_0px_var(--shadow-color)]">
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

                      <div className="text-[11px] text-muted-foreground font-medium pt-2 border-t-2 border-border/40 flex items-center justify-between">
                        <span>
                          {getAccuracyText(
                            concept.correctCount,
                            concept.attemptsCount,
                            concept.score,
                          )}
                        </span>
                        <span className="text-primary font-bold group-hover:underline flex items-center gap-1">
                          View details &amp; help
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
                <h2 className="font-bold text-base sm:text-lg tracking-tight text-foreground">
                  All Course Topics
                </h2>
              </div>
              <Badge variant="outline" className="text-xs text-foreground font-bold bg-muted px-3 py-0.5 border-1.5 border-border rounded-xs font-mono">
                {conceptsWithRisk.length} topics
              </Badge>
            </div>

            <motion.div variants={containerVariants} className="space-y-3">
              {conceptsWithRisk.map((concept, idx) => (
                <motion.div key={concept.id} variants={itemVariants}>
                  <Link
                    href={`/dashboard/gaps/${concept.id}`}
                    id={`all-concept-${idx}`}
                    className="group block rounded-xl p-4 sm:p-4.5 border-2 border-border bg-card hover:-translate-x-px hover:-translate-y-px shadow-[2px_2px_0px_var(--shadow-color)] hover:shadow-[3px_3px_0px_var(--shadow-color)] transition-all duration-150 space-y-2.5 cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-2.5 w-2.5 rounded-xs bg-primary border border-border group-hover:scale-110 transition-transform shrink-0" />
                        <span className="font-bold text-sm sm:text-base group-hover:text-primary transition-colors truncate text-foreground">
                          {concept.name}
                        </span>
                        <Badge variant="outline" className="hidden sm:inline-flex text-[10px] uppercase tracking-wider text-muted-foreground font-bold px-2 py-0.5 bg-muted border-1.5 border-border rounded-xs">
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

                    <div className="text-[11px] text-muted-foreground font-medium flex items-center justify-between pt-1 border-t-2 border-border/40">
                      <span>
                        {getAccuracyText(
                          concept.correctCount,
                          concept.attemptsCount,
                          concept.score,
                        )}
                      </span>
                      <span className="text-muted-foreground group-hover:text-primary transition-colors text-[10px] font-bold flex items-center gap-1">
                        See lesson breakdown
                        <ChevronRight className="h-3.5 w-3.5" />
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
