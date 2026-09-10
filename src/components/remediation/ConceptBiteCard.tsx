"use client";

import { useState, useEffect } from "react";
import {
  Brain,
  Lightbulb,
  Zap,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface QuickCheckOption {
  key: "A" | "B" | "C" | "D";
  text: string;
}

interface QuickCheckQuestion {
  question: string;
  options: QuickCheckOption[];
  correctAnswer: "A" | "B" | "C" | "D";
  explanation: string;
}

interface ConceptBiteSection {
  intuition: string;
  analogy: string;
  anchor: string;
  quickCheck: QuickCheckQuestion;
}

interface BilingualChallenge {
  en: QuickCheckQuestion;
  hi: QuickCheckQuestion;
}

interface ConceptBiteData {
  conceptName: string;
  intuition: string;
  analogy: string;
  anchorEn?: string;
  anchorHi?: string;
  vernacularAnchor?: string;
  en?: ConceptBiteSection;
  hi?: ConceptBiteSection;
  quickCheck: QuickCheckQuestion;
  challengePool?: BilingualChallenge[];
  activeChallengeIndex?: number;
  isAiGenerated?: boolean;
}

interface ConceptBiteCardProps {
  conceptId: string;
  conceptName: string;
  description?: string;
  className?: string;
  onVerified?: () => void;
}

export function ConceptBiteCard({
  conceptId,
  conceptName,
  description,
  className,
  onVerified,
}: ConceptBiteCardProps) {
  const [data, setData] = useState<ConceptBiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick-check interactive state
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [challengeIdx, setChallengeIdx] = useState<number>(0);

  function fetchBite(forceRefresh = false) {
    setLoading(true);
    setError(null);
    setSelectedKey(null);
    setChecked(false);

    // Randomize seed on each fetch so refresh picks a fresh challenge
    const randSeed = Math.floor(Math.random() * 1000);

    fetch("/api/ai/concept-bite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conceptId,
        conceptName,
        description,
        forceRefresh,
        challengeIndex: randSeed,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errBody = await res.json().catch(() => null);
          const msg = errBody?.error || "Unable to load concept bite. Please try again.";
          throw new Error(msg);
        }
        return res.json();
      })
      .then((json: ConceptBiteData) => {
        setData(json);
        const poolLen = json.challengePool?.length || 1;
        const initialIdx =
          typeof json.activeChallengeIndex === "number"
            ? json.activeChallengeIndex % poolLen
            : Math.floor(Math.random() * poolLen);
        setChallengeIdx(initialIdx);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load concept bite:", err);
        setError("Could not load concept bite at this time.");
        setLoading(false);
      });
  }

  useEffect(() => {
    let isCancelled = false;
    const randSeed = Math.floor(Math.random() * 1000);

    fetch("/api/ai/concept-bite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conceptId,
        conceptName,
        description,
        forceRefresh: false,
        challengeIndex: randSeed,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errBody = await res.json().catch(() => null);
          const msg = errBody?.error || "Unable to load concept bite. Please try again.";
          throw new Error(msg);
        }
        return res.json();
      })
      .then((json: ConceptBiteData) => {
        if (!isCancelled) {
          setData(json);
          const poolLen = json.challengePool?.length || 1;
          const initialIdx =
            typeof json.activeChallengeIndex === "number"
              ? json.activeChallengeIndex % poolLen
              : Math.floor(Math.random() * poolLen);
          setChallengeIdx(initialIdx);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error("Failed to load concept bite:", err);
          setError("Could not load concept bite at this time.");
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [conceptId, conceptName, description]);

  function handleSelectOption(key: "A" | "B" | "C" | "D", activeAnswer: string) {
    if (checked) return;
    setSelectedKey(key);
    setChecked(true);
    if (key === activeAnswer && onVerified) {
      onVerified();
    }
  }

  function handleNextChallenge() {
    setSelectedKey(null);
    setChecked(false);
    if (data?.challengePool && data.challengePool.length > 1) {
      setChallengeIdx((prev) => (prev + 1) % data.challengePool!.length);
    } else {
      fetchBite(true);
    }
  }

  if (loading) {
    return (
      <div
        className={cn(
          "glass-card rounded-2xl p-6 border-primary/20 space-y-4",
          className
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-5 w-24 rounded-md" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  // Resolve current active language content
  const isHi = lang === "hi";

  const intuitionText = isHi
    ? data.hi?.intuition || data.intuition
    : data.en?.intuition || data.intuition;

  const analogyText = isHi
    ? data.hi?.analogy || data.analogy
    : data.en?.analogy || data.analogy;

  // Language-specific anchor formulas
  const anchorText = isHi
    ? data.anchorHi || data.hi?.anchor || data.vernacularAnchor || "याद रखें: मुख्य सिद्धांत को समझें।"
    : data.anchorEn || data.en?.anchor || "Remember: Master the core invariant before diving into practice.";

  // Resolve active question from challengePool or fallback
  const pool = data.challengePool;
  let activeQuestion: QuickCheckQuestion;

  if (pool && pool.length > 0) {
    const pair = pool[challengeIdx % pool.length];
    activeQuestion = isHi ? pair.hi : pair.en;
  } else if (isHi && data.hi?.quickCheck) {
    activeQuestion = data.hi.quickCheck;
  } else if (!isHi && data.en?.quickCheck) {
    activeQuestion = data.en.quickCheck;
  } else {
    activeQuestion = data.quickCheck;
  }

  const isCorrect = selectedKey === activeQuestion.correctAnswer;

  return (
    <div
      className={cn(
        "glass-card rounded-2xl p-6 sm:p-7 space-y-5 border-primary/20 shadow-lg relative overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Zap className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <span>{isHi ? "60-सेकंड अवधारणा विवरण" : "60-Second Concept Bite"}</span>
              <span className="text-xs font-normal text-muted-foreground">
                • {data.conceptName}
              </span>
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {isHi
                ? "अभ्यास जारी रखने से पहले मूल समझ (Intuition) को समझें"
                : "Master the intuition before continuing practice"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Working Language Toggle */}
          <div className="flex items-center bg-background/60 border border-border rounded-lg p-0.5 text-[11px]">
            <Button
              type="button"
              variant={!isHi ? "default" : "ghost"}
              size="xs"
              onClick={() => setLang("en")}
              className="h-6 px-2.5 text-xs font-semibold"
            >
              EN
            </Button>
            <Button
              type="button"
              variant={isHi ? "default" : "ghost"}
              size="xs"
              onClick={() => setLang("hi")}
              className="h-6 px-2.5 text-xs font-semibold"
            >
              हिन्दी
            </Button>
          </div>

          <Badge variant="outline" className="border-primary/20 bg-primary/10 text-[10px] font-medium text-primary">
            <Sparkles className="h-3 w-3 mr-1" />
            {isHi ? "त्वरित सुधार" : "Remediation Bite"}
          </Badge>
        </div>
      </div>

      {/* 1. Core Intuition & Analogy Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Intuition */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Brain className="h-4 w-4" />
            <span>
              {isHi
                ? "💡 सहज समझ (यह क्यों आवश्यक है):"
                : "Core intuition (why it exists):"}
            </span>
          </div>
          <p className="text-xs text-foreground/90 leading-relaxed">
            {intuitionText}
          </p>
        </div>

        {/* Real-World Analogy */}
        <div className="rounded-xl border border-warning/20 bg-warning/5 p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-warning">
            <Lightbulb className="h-4 w-4" />
            <span>
              {isHi
                ? "🌍 वास्तविक दुनिया का मानसिक मॉडल:"
                : "Real-world mental model:"}
            </span>
          </div>
          <p className="text-xs text-foreground/90 leading-relaxed">
            {analogyText}
          </p>
        </div>
      </div>

      {/* 10-Second Anchor Formula */}
      <div className="rounded-xl border border-success/25 bg-success/5 px-4 py-3 flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-success">
            💡 {isHi ? "१०-सेकंड सूत्र (NEP 2020)" : "10-Second Anchor Formula"}
          </span>
          <p className="text-xs font-medium text-foreground">
            {anchorText}
          </p>
        </div>
      </div>

      {/* 2. Tricky Conceptual Quick-Check */}
      <div className="rounded-xl border border-border bg-card/40 p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">
              {isHi ? "🎯 अपनी समझ परखें:" : "Check your intuition:"}
            </span>
            <Badge variant="secondary" className="text-[10px] font-mono">
              {isHi ? "असली दुनिया की चुनौती" : "Application Scenario"}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {/* Random Tricky Question Cycler Button */}
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={handleNextChallenge}
              className="text-[11px]"
              title="Try another random scenario"
            >
              <span className="mr-1">🎲</span>
              <span>{isHi ? "नया परिदृश्य" : "Try another scenario"}</span>
            </Button>

            {checked && (
              <Badge
                variant={isCorrect ? "default" : "warning"}
                className="text-[11px] font-medium flex items-center gap-1"
              >
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {isHi ? "अवधारणा सत्यापित" : "Concept verified"}
                  </>
                ) : (
                  <>
                    <XCircle className="h-3.5 w-3.5" />
                    {isHi ? "नीचे स्पष्टीकरण देखें" : "Review explanation below"}
                  </>
                )}
              </Badge>
            )}
          </div>
        </div>

        <p className="text-xs font-medium text-foreground leading-relaxed">
          {activeQuestion.question}
        </p>

        {/* Options */}
        <div className="space-y-2">
          {activeQuestion.options.map((opt) => {
            const isSelected = selectedKey === opt.key;
            const isAnswer = opt.key === activeQuestion.correctAnswer;

            let optStyle =
              "border-border hover:border-primary/40 hover:bg-muted/50 text-foreground";
            if (checked) {
              if (isAnswer) {
                optStyle =
                  "border-success/60 bg-success/10 text-foreground font-medium";
              } else if (isSelected) {
                optStyle =
                  "border-destructive/60 bg-destructive/10 text-destructive";
              } else {
                optStyle = "border-border/40 opacity-60";
              }
            } else if (isSelected) {
              optStyle = "border-primary bg-primary/10 text-primary font-medium";
            }

            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => handleSelectOption(opt.key, activeQuestion.correctAnswer)}
                disabled={checked}
                className={cn(
                  "w-full flex items-center gap-3 p-2.5 rounded-xl border text-left text-xs transition-colors cursor-pointer",
                  optStyle
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-[11px] font-mono font-medium",
                    checked && isAnswer
                      ? "border-success bg-success text-success-foreground"
                      : checked && isSelected
                      ? "border-destructive bg-destructive text-white"
                      : "border-border bg-background text-muted-foreground"
                  )}
                >
                  {opt.key}
                </span>
                <span className="flex-1 leading-snug">{opt.text}</span>
              </button>
            );
          })}
        </div>

        {/* Explanation on check */}
        {checked && (
          <div
            className={cn(
              "rounded-lg p-3 text-xs leading-relaxed",
              isCorrect
                ? "bg-success/10 border border-success/20 text-foreground"
                : "bg-warning/10 border border-warning/20 text-foreground"
            )}
          >
            <p className="font-semibold mb-0.5">
              {isCorrect
                ? isHi ? "✅ उत्कृष्ट समझ!" : "✅ Conceptual alignment verified"
                : isHi ? "💡 यह क्यों काम करता है:" : "💡 Intuitive explanation:"}
            </p>
            <p className="text-muted-foreground">{activeQuestion.explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
}
