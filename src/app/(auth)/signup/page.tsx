"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Eye, EyeOff, Loader2, ArrowRight, MailCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

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
      const redirectUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : undefined;

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: { full_name: trimmedName, role },
          emailRedirectTo: redirectUrl,
        },
      });

      if (signUpError) {
        console.error("Sign up error:", signUpError.message);
        if (
          signUpError.message.toLowerCase().includes("already registered") ||
          signUpError.message.toLowerCase().includes("unique constraint")
        ) {
          setError("An account with this email address already exists.");
        } else {
          setError(
            signUpError.message ||
              "Unable to create account. Please try again.",
          );
        }
        setLoading(false);
        return;
      }

      // If email confirmation is enabled in Supabase, session is null
      if (data?.user && !data?.session) {
        setEmailSent(true);
        setLoading(false);
        return;
      }

      // Auto-confirmed or email verification disabled in Supabase
      router.push(role === "teacher" ? "/teacher" : "/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Unexpected signup error:", err);
      setError(
        "An unexpected error occurred during sign up. Please try again.",
      );
      setLoading(false);
    }
  }

  if (emailSent) {
    return (
      <div className="space-y-6 text-center py-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border-2 border-primary text-primary mx-auto shadow-[3px_3px_0px_var(--shadow-color)]">
          <MailCheck className="h-8 w-8 stroke-[2.5]" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground font-heading">
            Check your email
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            We sent a verification link to{" "}
            <span className="font-bold text-foreground">{email}</span>. Click
            the link in your inbox to confirm your account and get started.
          </p>
        </div>

        <div className="rounded-lg border-2 border-border bg-muted/40 p-4 text-xs text-muted-foreground text-left space-y-1.5 shadow-[2px_2px_0px_var(--shadow-color)]">
          <p className="font-semibold text-foreground">
            Didn&apos;t receive an email?
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Check your spam or junk folder.</li>
            <li>Make sure you entered the correct email address.</li>
            <li>Wait a minute or try signing up again.</li>
          </ul>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Link
            href="/login"
            className={cn(
              "w-full h-11 rounded-md font-bold shadow-[2px_2px_0px_var(--shadow-color)] bg-primary text-primary-foreground hover:bg-primary/95 inline-flex items-center justify-center border-2 border-border",
            )}
          >
            Return to Sign in
          </Link>

          <Button
            type="button"
            variant="outline"
            onClick={() => setEmailSent(false)}
            className="w-full h-11 rounded-md font-bold border-2 border-border shadow-[2px_2px_0px_var(--shadow-color)]"
          >
            Back to Sign up form
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-7">
        <h2 className="text-2xl font-bold tracking-tight text-foreground font-heading">
          Create your account
        </h2>
        <p className="text-sm font-medium text-muted-foreground mt-1">
          Start understanding your learning gaps today.
        </p>
      </div>

      <form onSubmit={handleSignup} className="space-y-4" id="signup-form">
        {/* Full name */}
        <div className="space-y-1.5">
          <Label
            htmlFor="signup-name"
            className="text-xs font-bold text-foreground uppercase tracking-wider"
          >
            Full Name
          </Label>
          <Input
            id="signup-name"
            type="text"
            autoComplete="name"
            required
            maxLength={60}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Rebortak Roy"
            className="h-11 px-4"
          />
        </div>

        {/* Role selector */}
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-foreground uppercase tracking-wider">
            I am a…
          </Label>
          <div
            className="grid grid-cols-2 gap-2.5"
            role="radiogroup"
            aria-label="Role selection"
          >
            {(["student", "teacher"] as const).map((r) => (
              <Button
                key={r}
                type="button"
                id={`role-${r}`}
                role="radio"
                variant={role === r ? "default" : "outline"}
                aria-checked={role === r}
                onClick={() => setRole(r)}
                className={cn(
                  "rounded-md h-11 text-sm font-bold capitalize cursor-pointer",
                  role === r
                    ? "bg-[#151313] text-[#FFFFFF] border-2 border-[#151313] shadow-[2px_2px_0px_var(--shadow-color)]"
                    : "border-2 border-border bg-card text-foreground shadow-[2px_2px_0px_var(--shadow-color)]",
                )}
              >
                {r}
              </Button>
            ))}
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label
            htmlFor="signup-email"
            className="text-xs font-bold text-foreground uppercase tracking-wider"
          >
            Email
          </Label>
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            required
            maxLength={100}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-11 px-4"
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label
            htmlFor="signup-password"
            className="text-xs font-bold text-foreground uppercase tracking-wider"
          >
            Password
          </Label>
          <div className="relative">
            <Input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={72}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11 px-4 pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              id="toggle-password-visibility"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer shadow-none border-transparent hover:border-transparent"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 stroke-[2.5]" />
              ) : (
                <Eye className="h-4 w-4 stroke-[2.5]" />
              )}
            </Button>
          </div>
        </div>

        {error && (
          <div
            id="signup-error"
            role="alert"
            className="rounded-md border-2 border-destructive bg-destructive/10 px-4 py-3 text-xs font-bold text-destructive shadow-[2px_2px_0px_var(--shadow-color)]"
          >
            {error}
          </div>
        )}

        <Button
          id="signup-submit-btn"
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-md font-bold shadow-[2px_2px_0px_var(--shadow-color)] cursor-pointer mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Creating account…
            </>
          ) : (
            <>
              Create account
              <ArrowRight className="h-4 w-4 ml-1.5 stroke-[2.5]" />
            </>
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm font-medium text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          id="login-link"
          className="font-bold text-primary underline underline-offset-4 hover:opacity-80 transition-opacity"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
