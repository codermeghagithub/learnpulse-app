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
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
        setError("Could not load concept bite");
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
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
          setError("Could not load concept bite");
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
          "glass-card rounded-2xl p-6 border-primary/20 space-y-4 animate-pulse",
          className
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/20" />
            <div className="h-4 w-40 bg-muted rounded" />
          </div>
          <div className="h-5 w-24 bg-muted rounded-full" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full bg-muted/60 rounded" />
          <div className="h-3 w-4/5 bg-muted/60 rounded" />
        </div>
        <div className="h-24 bg-muted/30 rounded-xl" />
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
        "glass-card rounded-2xl p-6 sm:p-7 space-y-5 border-primary/30 shadow-lg relative overflow-hidden animate-slide-up",
        className
      )}
    >
      {/* Top ambient glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-36 h-36 rounded-full bg-primary/10 blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-brand text-white shadow-sm">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <span>{isHi ? "60-सेकंड कॉन्सेप्ट बाइट" : "60-Second Concept Bite"}</span>
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
            <button
              type="button"
              onClick={() => setLang("en")}
              className={cn(
                "px-2.5 py-0.5 rounded font-medium transition-all cursor-pointer",
                !isHi
                  ? "bg-primary text-white font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang("hi")}
              className={cn(
                "px-2.5 py-0.5 rounded font-medium transition-all cursor-pointer",
                isHi
                  ? "bg-primary text-white font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              हिन्दी
            </button>
          </div>

          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-primary/20 bg-primary/10 text-[10px] font-semibold text-primary">
            <Sparkles className="h-3 w-3" />
            <span>{isHi ? "त्वरित सुधार" : "Remediation Bite"}</span>
          </div>
        </div>
      </div>

      {/* 1. Core Intuition & Analogy Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Intuition */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
            <Brain className="h-4 w-4" />
            <span>
              {isHi
                ? "💡 सहज समझ (यह क्यों आवश्यक है):"
                : "Core Intuition (Why it exists):"}
            </span>
          </div>
          <p className="text-xs text-foreground/90 leading-relaxed">
            {intuitionText}
          </p>
        </div>

        {/* Real-World Analogy */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
            <Lightbulb className="h-4 w-4" />
            <span>
              {isHi
                ? "🌍 वास्तविक दुनिया का मानसिक मॉडल:"
                : "Real-World Mental Model:"}
            </span>
          </div>
          <p className="text-xs text-foreground/90 leading-relaxed">
            {analogyText}
          </p>
        </div>
      </div>

      {/* 10-Second Anchor Formula (Clean English in EN, Clean Hindi in HI) */}
      <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3 flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400">
            💡 {isHi ? "१०-सेकंड सूत्र (NEP 2020)" : "10-Second Anchor Formula"}
          </span>
          <p className="text-xs font-medium text-foreground">
            {anchorText}
          </p>
        </div>
      </div>

      {/* 2. Tricky Conceptual Quick-Check */}
      <div className="rounded-xl border border-border/80 bg-background/40 p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-foreground">
              {isHi ? "🎯 अपनी समझ परखें (Check Your Intuition):" : "Check Your Intuition:"}
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/10 text-primary font-mono">
              {isHi ? "असली दुनिया की चुनौती" : "Real-World Dilemma"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Random Tricky Question Cycler Button */}
            <button
              type="button"
              onClick={handleNextChallenge}
              className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border border-border bg-background/80 hover:bg-primary/10 hover:border-primary/40 text-foreground transition-all cursor-pointer"
              title="Try another random tricky scenario"
            >
              <span>🎲</span>
              <span>{isHi ? "नया प्रश्न आज़माएं" : "Try Another Scenario"}</span>
            </button>

            {checked && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full",
                  isCorrect
                    ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                    : "text-amber-400 bg-amber-500/10 border border-amber-500/20"
                )}
              >
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {isHi ? "अवधारणा सत्यापित" : "Concept Verified"}
                  </>
                ) : (
                  <>
                    <XCircle className="h-3.5 w-3.5" />
                    {isHi ? "नीचे स्पष्टीकरण देखें" : "Review Explanation Below"}
                  </>
                )}
              </span>
            )}
          </div>
        </div>

        <p className="text-xs font-medium text-foreground/95 leading-relaxed">
          {activeQuestion.question}
        </p>

        {/* Options */}
        <div className="space-y-2">
          {activeQuestion.options.map((opt) => {
            const isSelected = selectedKey === opt.key;
            const isAnswer = opt.key === activeQuestion.correctAnswer;

            let optStyle =
              "border-border/70 hover:border-primary/40 hover:bg-primary/5 text-foreground";
            if (checked) {
              if (isAnswer) {
                optStyle =
                  "border-emerald-500/60 bg-emerald-500/10 text-emerald-300 font-medium";
              } else if (isSelected) {
                optStyle =
                  "border-red-500/60 bg-red-500/10 text-red-300";
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
                  "w-full flex items-center gap-3 p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer",
                  optStyle
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-[11px] font-bold",
                    checked && isAnswer
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : checked && isSelected
                      ? "border-red-500 bg-red-500 text-white"
                      : "border-border bg-background/60 text-muted-foreground"
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
              "rounded-lg p-3 text-xs leading-relaxed animate-fade-in",
              isCorrect
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-200"
                : "bg-amber-500/10 border border-amber-500/20 text-amber-200"
            )}
          >
            <p className="font-semibold mb-0.5">
              {isCorrect
                ? isHi ? "✅ बेहतरीन समझ!" : "✅ Excellent Intuition!"
                : isHi ? "💡 यह क्यों काम करता है:" : "💡 Real-World Explanation:"}
            </p>
            <p>{activeQuestion.explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
}
