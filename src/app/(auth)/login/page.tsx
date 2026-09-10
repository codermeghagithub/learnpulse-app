"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password || password.length < 6 || password.length > 72) {
      setError("Password must be between 6 and 72 characters.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (signInError) {
        console.error("Sign in error:", signInError.message);
        if (signInError.message.toLowerCase().includes("invalid login credentials")) {
          setError("Invalid email or password. Please try again.");
        } else if (signInError.message.toLowerCase().includes("email not confirmed")) {
          setError("Please verify your email address before signing in.");
        } else {
          setError("Unable to sign in. Please check your credentials and try again.");
        }
        setLoading(false);
        return;
      }

      // Fetch role server-side via profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .single();

      if (profile?.role === "teacher") {
        router.push("/teacher");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err) {
      console.error("Unexpected login error:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mb-7">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Sign in to continue your learning journey.
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4" id="login-form">
        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="login-email" className="text-sm font-medium text-foreground">
            Email
          </Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            maxLength={100}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="rounded-xl border-border bg-muted/40 px-4 py-3 h-11 text-sm placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="login-password" className="text-sm font-medium text-foreground">
            Password
          </Label>
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              maxLength={72}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="rounded-xl border-border bg-muted/40 px-4 py-3 pr-10 h-11 text-sm placeholder:text-muted-foreground/60"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              id="toggle-password-visibility"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {error && (
          <div
            id="login-error"
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        <Button
          id="login-submit-btn"
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-xl font-semibold shadow-sm cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in…
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          id="signup-link"
          className="font-medium text-primary hover:underline"
        >
          Sign up
        </Link>
      </p>
    </>
  );
}
