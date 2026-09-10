"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ThemeToggleProps {
  className?: string;
}

function subscribeTheme(callback: () => void) {
  window.addEventListener("learnpulse-theme-change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("learnpulse-theme-change", callback);
    window.removeEventListener("storage", callback);
  };
}

function getThemeSnapshot(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  const saved = localStorage.getItem("learnpulse-theme");
  return saved === "light" ? "light" : "dark";
}

function getServerSnapshot(): "dark" | "light" {
  return "dark";
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerSnapshot);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  useEffect(() => {
    if (theme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  }, [theme]);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    localStorage.setItem("learnpulse-theme", nextTheme);
    if (nextTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
    window.dispatchEvent(new Event("learnpulse-theme-change"));
  }

  const currentTheme = mounted ? theme : "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      id="theme-toggle-btn"
      aria-label={`Switch to ${currentTheme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${currentTheme === "dark" ? "light" : "dark"} mode`}
      className={cn(
        "relative rounded-md border-2 border-border bg-card text-foreground shadow-[2px_2px_0px_var(--shadow-color)] hover:shadow-[3px_3px_0px_var(--shadow-color)] cursor-pointer font-medium",
        className
      )}
    >
      {!mounted ? (
        <span className="h-4 w-4" />
      ) : theme === "dark" ? (
        <Sun className="h-4.5 w-4.5 text-[#FCCC42] transition-transform duration-200 stroke-[2.5]" />
      ) : (
        <Moon className="h-4.5 w-4.5 text-[#151313] transition-transform duration-200 stroke-[2.5]" />
      )}
    </Button>
  );
}
