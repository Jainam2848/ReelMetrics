"use client";

import React, { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/shared/toast";
import { m } from "framer-motion";
import { Sparkles, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

// Developer presets are surfaced only outside production builds; they exist
// purely to let local engineers jump into a seeded sandbox quickly.
const DEV_PRESETS_ENABLED = process.env.NODE_ENV !== "production";

interface FieldErrors {
  email?: string;
  password?: string;
  form?: string;
}

function LoginForm() {
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!email.trim()) {
      next.email = "Enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "That doesn't look like a valid email.";
    }
    if (!password) {
      next.password = "Enter your password.";
    }
    return next;
  };

  const handleDevPreset = async (preset: string) => {
    if (!DEV_PRESETS_ENABLED || loading) return;
    setLoading(true);
    setErrors({});
    setEmail(preset);
    setPassword("password123");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: preset,
      password: "password123",
    });
    setLoading(false);
    if (error) {
      setErrors({
        form:
          "Local seed user not found. Run the database seed script before using developer presets.",
      });
      return;
    }
    toast.success(`Signed in as ${preset}.`);
    router.push(redirectTo);
    router.refresh();
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const validation = validate();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }
    setErrors({});
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      if (/invalid login credentials/i.test(error.message)) {
        setErrors({
          form:
            "Email and password don't match an existing account. Check your details or create one below.",
        });
        return;
      }
      setErrors({ form: error.message });
      return;
    }

    toast.success("Welcome back.");
    router.push(redirectTo);
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground relative p-6">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-brand-accent/10 rounded-full blur-3xl -z-10 animate-pulse" />

      <m.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", duration: 0.8 }}
        className="w-full max-w-md border border-glass bg-glass backdrop-blur-2xl rounded-2xl p-8 shadow-glow relative"
      >
        <div className="flex flex-col items-center mb-8 text-center select-none">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-accent flex items-center justify-center font-display font-black text-white text-xl shadow-glow mb-4">
            T
          </div>
          <h2 className="text-2xl font-display font-extrabold tracking-tight text-white">
            Sign in to Trendoraa
          </h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Unlock AI-powered short-form video analytics and weekly strategies.
          </p>
        </div>

        {DEV_PRESETS_ENABLED && (
          <div className="p-4 bg-white/5 border border-glass rounded-xl mb-6 flex flex-col gap-2 select-none">
            <div className="flex items-center gap-1.5 text-xs text-brand-primary font-bold uppercase tracking-wider pl-1">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Developer presets (local only)</span>
            </div>
            <p className="text-[10px] text-gray-400 font-semibold mb-2">
              These shortcuts are only visible in development builds. They use seeded test accounts.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleDevPreset("userA@example.com")}
                className="py-2.5 rounded-lg border border-glass bg-white/5 hover:bg-white/10 text-[10px] font-bold text-gray-200 active:scale-95 transition-all"
              >
                Alice (1.2K)
              </button>
              <button
                type="button"
                onClick={() => handleDevPreset("userB@example.com")}
                className="py-2.5 rounded-lg border border-glass bg-white/5 hover:bg-white/10 text-[10px] font-bold text-gray-200 active:scale-95 transition-all"
              >
                Bob (15.4K)
              </button>
            </div>
          </div>
        )}

        {errors.form && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-100"
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errors.form}</span>
          </div>
        )}

        <form onSubmit={handleSignIn} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-email" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="creator@trendoraa.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "login-email-error" : undefined}
                className={`w-full min-h-[42px] pl-10 pr-4 bg-white/5 rounded-xl border text-xs font-semibold text-gray-200 focus:outline-none ${
                  errors.email ? "border-red-500/60 focus:border-red-500" : "border-glass focus:border-brand-primary"
                }`}
              />
            </div>
            {errors.email && (
              <p id="login-email-error" className="text-[10px] text-red-300 pl-1">
                {errors.email}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-password" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "login-password-error" : undefined}
                className={`w-full min-h-[42px] pl-10 pr-4 bg-white/5 rounded-xl border text-xs font-semibold text-gray-200 focus:outline-none ${
                  errors.password ? "border-red-500/60 focus:border-red-500" : "border-glass focus:border-brand-primary"
                }`}
              />
            </div>
            {errors.password && (
              <p id="login-password-error" className="text-[10px] text-red-300 pl-1">
                {errors.password}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 min-h-[44px] bg-brand-primary hover:opacity-90 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 shadow-glow cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span>{loading ? "Signing in…" : "Sign in"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center mt-6 select-none">
          <p className="text-xs text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-brand-primary hover:underline font-bold">
              Sign Up Free
            </Link>
          </p>
        </div>
      </m.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground relative p-6">
          <div className="w-full max-w-md border border-glass bg-glass backdrop-blur-2xl rounded-2xl p-8 shadow-glow flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-10 h-10 rounded-full border-4 border-white/5 border-t-brand-primary animate-spin" />
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
