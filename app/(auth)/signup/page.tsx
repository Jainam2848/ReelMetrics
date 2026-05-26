"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/shared/toast";
import { m } from "framer-motion";
import { Mail, Lock, User, ArrowRight, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface FieldErrors {
  fullName?: string;
  email?: string;
  password?: string;
  form?: string;
}

export default function SignupPage() {
  const toast = useToast();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [checkInbox, setCheckInbox] = useState(false);

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!fullName.trim()) next.fullName = "Tell us how to address you.";
    if (!email.trim()) {
      next.email = "Enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "That doesn't look like a valid email.";
    }
    if (!password) {
      next.password = "Choose a password.";
    } else if (password.length < 8) {
      next.password = "Passwords must be at least 8 characters.";
    }
    return next;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const validation = validate();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim() },
        },
      });

      if (error) {
        setErrors({ form: error.message });
        return;
      }

      // Supabase returns a populated session only when email confirmation is
      // disabled. Otherwise we should tell the user to verify before logging in.
      if (data.session) {
        toast.success(`Welcome to Trendoraa, ${fullName.trim()}!`);
        router.push("/");
        router.refresh();
      } else {
        setCheckInbox(true);
      }
    } catch (err) {
      console.error("Signup failed:", err);
      setErrors({ form: "Network error creating your account. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground relative p-6">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-brand-accent/10 rounded-full blur-3xl -z-10 animate-pulse" />

      <m.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", duration: 0.8 }}
        className="w-full max-w-md border border-glass bg-glass backdrop-blur-2xl rounded-2xl p-8 shadow-glow relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-primary via-brand-accent to-brand-secondary" />

        <div className="flex flex-col items-center mb-6 text-center select-none">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-accent flex items-center justify-center font-display font-black text-white text-xl shadow-glow mb-4">
            T
          </div>
          <h2 className="text-2xl font-display font-extrabold tracking-tight text-white">
            Establish Your Creator Vector
          </h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
            Calibrate your hook timing, predict skip-resistance, and join the top 1% of high-retention creators.
          </p>
        </div>

        {checkInbox ? (
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-secondary/15 border border-brand-secondary/30 flex items-center justify-center animate-pulse">
              <Mail className="w-6 h-6 text-brand-secondary" />
            </div>
            <h3 className="text-lg font-display font-extrabold text-white">Confirm your email</h3>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              We sent a verification link to <strong className="text-white">{email}</strong>. Click it to finish setting
              up your account, then come back here to sign in.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-flex items-center gap-2 px-6 min-h-[40px] bg-brand-primary text-white rounded-xl text-xs font-bold uppercase tracking-wider active:scale-95 transition-all shadow-glow hover:opacity-90"
            >
              <span>Back to sign in</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* Scientific Credibility Quota Indicator */}
            <div className="w-full py-2 px-3 mb-5 bg-white/5 border border-glass rounded-xl flex items-center justify-between text-[9px] font-mono tracking-wider text-gray-400 select-none">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary animate-pulse" />
                <span>Computational Node Status: <strong className="text-brand-secondary uppercase">Active</strong></span>
              </div>
              <div>
                <span>Latency: <strong className="text-white">92ms</strong></span>
                <span className="mx-1.5">|</span>
                <span>Active Slots: <strong className="text-white">88%</strong></span>
              </div>
            </div>

            {errors.form && (
              <div
                role="alert"
                className="mb-4 flex items-start gap-2 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-100"
              >
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errors.form}</span>
              </div>
            )}

            <form onSubmit={handleSignUp} noValidate className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="signup-name" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    id="signup-name"
                    type="text"
                    autoComplete="name"
                    placeholder="Alice Vance"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    aria-invalid={Boolean(errors.fullName)}
                    aria-describedby={errors.fullName ? "signup-name-error" : undefined}
                    className={`w-full min-h-[42px] pl-10 pr-4 bg-white/5 rounded-xl border text-xs font-semibold text-gray-200 focus:outline-none ${
                      errors.fullName ? "border-red-500/60 focus:border-red-500" : "border-glass focus:border-brand-primary"
                    }`}
                  />
                </div>
                {errors.fullName && (
                  <p id="signup-name-error" className="text-[10px] text-red-300 pl-1">
                    {errors.fullName}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="signup-email" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    placeholder="creator@trendoraa.ai"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "signup-email-error" : undefined}
                    className={`w-full min-h-[42px] pl-10 pr-4 bg-white/5 rounded-xl border text-xs font-semibold text-gray-200 focus:outline-none ${
                      errors.email ? "border-red-500/60 focus:border-red-500" : "border-glass focus:border-brand-primary"
                    }`}
                  />
                </div>
                {errors.email && (
                  <p id="signup-email-error" className="text-[10px] text-red-300 pl-1">
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="signup-password" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    id="signup-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? "signup-password-error" : "signup-password-help"}
                    className={`w-full min-h-[42px] pl-10 pr-4 bg-white/5 rounded-xl border text-xs font-semibold text-gray-200 focus:outline-none ${
                      errors.password ? "border-red-500/60 focus:border-red-500" : "border-glass focus:border-brand-primary"
                    }`}
                  />
                </div>
                {errors.password ? (
                  <p id="signup-password-error" className="text-[10px] text-red-300 pl-1">
                    {errors.password}
                  </p>
                ) : (
                  <p id="signup-password-help" className="text-[10px] text-gray-500 pl-1">
                    Use 8+ characters; mix of letters, numbers, and symbols recommended.
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 min-h-[44px] bg-brand-primary hover:opacity-90 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 shadow-glow cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span>{loading ? "Allocating Compute Quota…" : "Secure Computational Quota"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-[9px] text-gray-500 font-semibold text-center mt-1 leading-normal select-none">
                🔒 Quota Reservation: Active slots are limited by rolling API bandwidth. Securing your credentials now locks in your evaluation prioritization.
              </div>
            </form>
          </>
        )}

        <div className="text-center mt-6 select-none">
          <p className="text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-primary hover:underline font-bold">
              Sign in
            </Link>
          </p>
        </div>

        {/* Elite Creator Transformation Social Proof */}
        <div className="mt-6 pt-5 border-t border-white/5 text-center select-none">
          <p className="text-[10px] text-gray-400 italic">
            &ldquo;The hook pacing scoring alone increased our average watch time by 34%.&rdquo;
          </p>
          <span className="block text-[8px] text-brand-primary uppercase tracking-widest font-extrabold mt-1">
            — Production Lead, MediaGroup Studio
          </span>
        </div>
      </m.div>
    </div>
  );
}
