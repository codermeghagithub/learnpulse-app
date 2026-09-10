"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedName = fullName.trim();
    if (trimmedName.length < 2 || trimmedName.length > 60) {
      setError("Full name must be between 2 and 60 characters.");
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6 || password.length > 72) {
      setError("Password must be between 6 and 72 characters.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: { full_name: trimmedName, role },
        },
      });

      if (signUpError) {
        console.error("Sign up error:", signUpError.message);
        if (signUpError.message.toLowerCase().includes("already registered") || signUpError.message.toLowerCase().includes("unique constraint")) {
          setError("An account with this email address already exists.");
        } else {
          setError("Unable to create account. Please try again.");
        }
        setLoading(false);
        return;
      }

      // Redirect by role
      router.push(role === "teacher" ? "/teacher" : "/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Unexpected signup error:", err);
      setError("An unexpected error occurred during sign up. Please try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mb-7">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Create your account</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Start understanding your learning gaps today.
        </p>
      </div>

      <form onSubmit={handleSignup} className="space-y-4" id="signup-form">
        {/* Full name */}
        <div className="space-y-1.5">
          <label htmlFor="signup-name" className="text-sm font-medium text-foreground">
            Full Name
          </label>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            required
            maxLength={60}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Rebortak Roy"
            className={cn(
              "w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground",
              "placeholder:text-muted-foreground/60",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring",
              "transition-colors"
            )}
          />
        </div>

        {/* Role selector */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">I am a…</label>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Role selection">
            {(["student", "teacher"] as const).map((r) => (
              <button
                key={r}
                type="button"
                id={`role-${r}`}
                role="radio"
                aria-checked={role === r}
                onClick={() => setRole(r)}
                className={cn(
                  "rounded-xl border py-2.5 text-sm font-medium capitalize transition-colors cursor-pointer",
                  role === r
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border text-muted-foreground hover:border-border/80"
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="signup-email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            required
            maxLength={100}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={cn(
              "w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground",
              "placeholder:text-muted-foreground/60",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring",
              "transition-colors"
            )}
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label htmlFor="signup-password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <div className="relative">
            <input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={6}
              maxLength={72}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              className={cn(
                "w-full rounded-xl border border-border bg-muted/40 px-4 py-3 pr-10 text-sm text-foreground",
                "placeholder:text-muted-foreground/60",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring",
                "transition-colors"
              )}
            />
            <button
              type="button"
              id="toggle-signup-password"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div
            id="signup-error"
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        <button
          id="signup-submit-btn"
          type="submit"
          disabled={loading}
          className={cn(
            "w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors shadow-sm",
            loading
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
          )}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account…
            </>
          ) : (
            <>
              Create account
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          id="login-link"
          className="font-medium text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
