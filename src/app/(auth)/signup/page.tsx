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
    setLoading(true);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Redirect by role
    router.push(role === "teacher" ? "/teacher" : "/dashboard");
    router.refresh();
  }

  return (
    <>
      <div className="mb-7">
        <h2 className="text-2xl font-bold">Create your account</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Start understanding your learning gaps today.
        </p>
      </div>

      <form onSubmit={handleSignup} className="space-y-4" id="signup-form">
        {/* Full name */}
        <div className="space-y-1.5">
          <label htmlFor="signup-name" className="text-sm font-medium">
            Full Name
          </label>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Priya Sharma"
            className={cn(
              "w-full rounded-xl border bg-muted/50 px-4 py-3 text-sm",
              "placeholder:text-muted-foreground/50",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50",
              "transition-all duration-150"
            )}
          />
        </div>

        {/* Role selector */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">I am a…</label>
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
                  "rounded-xl border py-2.5 text-sm font-medium capitalize transition-all duration-150",
                  role === r
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30"
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="signup-email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={cn(
              "w-full rounded-xl border bg-muted/50 px-4 py-3 text-sm",
              "placeholder:text-muted-foreground/50",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50",
              "transition-all duration-150"
            )}
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label htmlFor="signup-password" className="text-sm font-medium">
            Password
          </label>
          <div className="relative">
            <input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              className={cn(
                "w-full rounded-xl border bg-muted/50 px-4 py-3 pr-10 text-sm",
                "placeholder:text-muted-foreground/50",
                "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50",
                "transition-all duration-150"
              )}
            />
            <button
              type="button"
              id="toggle-signup-password"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
            "w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all duration-200",
            loading
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "gradient-brand text-white glow-brand hover:opacity-90"
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
