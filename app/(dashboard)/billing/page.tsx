"use client";

import React, { useState } from "react";
import { useActiveAccount } from "@/components/shared/active-account-context";
import { useSubscription } from "@/hooks/use-subscription";
import { UsageMeter } from "@/components/dashboard/usage-meter";
import { LoadingSkeleton } from "@/components/dashboard/loading-skeleton";
import { LoadError } from "@/components/shared/load-error";
import { useToast } from "@/components/shared/toast";
import { 
  Check, 
  Sparkles, 
  ExternalLink, 
  Lock, 
  Zap,
  ShieldCheck
} from "lucide-react";

export default function BillingPage() {
  const { accounts } = useActiveAccount();
  const { subscription, usage, isLoading, error, mutate } = useSubscription();
  const toast = useToast();

  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoadingPlan, setCheckoutLoadingPlan] = useState<string | null>(null);

  const handlePortalRedirect = async () => {
    if (portalLoading) return;
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();

      if (data.success && data.data?.url) {
        window.location.assign(data.data.url);
      } else {
        toast.error(
          data?.error?.message ||
            "Stripe billing portal is not available right now. Try again later."
        );
      }
    } catch (err) {
      console.error("Stripe portal failure:", err);
      toast.error("Network error reaching the Stripe billing portal.");
    } finally {
      setPortalLoading(false);
    }
  };

  const handleCheckout = async (planId: string, planName: string) => {
    if (checkoutLoadingPlan) return;
    setCheckoutLoadingPlan(planId);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, returnUrl: window.location.origin + "/billing" }),
      });
      const data = await res.json();

      if (data?.success && data?.data?.checkoutUrl) {
        window.location.assign(data.data.checkoutUrl);
        return;
      }

      // 404 / endpoint not implemented yet: surface honestly instead of faking success.
      if (res.status === 404) {
        toast.info(
          `${planName} checkout is not wired up yet. Use "Manage Stripe Billing" to make changes.`
        );
        return;
      }

      toast.error(
        data?.error?.message ||
          `Could not start checkout for ${planName}. Please try again.`
      );
    } catch (err) {
      console.error("Checkout init failed:", err);
      toast.error("Network error reaching Stripe checkout.");
    } finally {
      setCheckoutLoadingPlan(null);
    }
  };

  const activePlanId = subscription?.planId || "free";
  const activePlanName = activePlanId.charAt(0).toUpperCase() + activePlanId.slice(1);

  // Pricing Plan Tiers definition
  const plans = [
    {
      id: "creator",
      name: "Growth Velocity Plan",
      price: "$39",
      desc: "For full-time digital creators scaling content velocity and testing high-impact hooks.",
      features: [
        "Dual-Profile Meta API Synchronization",
        "50 High-Fidelity Hook & Retention Scores",
        "4 Proprietary Growth Strategies / Week",
        "150 Priority API Processing Calls",
      ],
      cta: activePlanId === "creator" ? "Current Active Tier" : "Calibrate Growth",
      active: activePlanId === "creator",
      premium: false,
    },
    {
      id: "pro",
      name: "Algorithmic Scale Pro",
      price: "$89",
      desc: "Advanced multi-modal model analysis, prioritised execution paths, and custom growth strategies.",
      features: [
        "Multi-Profile Meta API Sync (Up to 5)",
        "200 High-Fidelity Hook & Retention Scores",
        "12 Custom Strategy Blueprints / Month",
        "600 Priority API Calls (Advanced Models)",
      ],
      cta: activePlanId === "pro" ? "Current Active Tier" : "Calibrate Scale Pro",
      active: activePlanId === "pro",
      premium: true,
    },
    {
      id: "agency",
      name: "Studio Enterprise Suite",
      price: "$249",
      desc: "Optimized for client management teams, digital media groups, and high-frequency production hubs.",
      features: [
        "Enterprise Operations Sync (Up to 20 Profiles)",
        "1000 High-Fidelity Hook & Retention Scores",
        "40 Custom Client Strategy Blueprints / Month",
        "2500 Priority API Calls (Premium Priority)",
      ],
      cta: activePlanId === "agency" ? "Current Active Tier" : "Scale Enterprise",
      active: activePlanId === "agency",
      premium: false,
    },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto select-none">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-display font-extrabold tracking-tight text-white mb-1">
          Calibrate Computational Quotas
        </h2>
        <p className="text-xs text-muted-foreground">
          Align your scaling requirements with our premium multi-modal scoring nodes. Configure your monthly computational limits.
        </p>
      </div>

      {/* Compute Guarantee Notice */}
      <div className="w-full p-4 rounded-xl border border-brand-primary/20 bg-brand-primary/5 backdrop-blur-md relative overflow-hidden flex items-start gap-3 select-none">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-2xl" />
        <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0 font-bold text-sm">
          🛡️
        </div>
        <div className="flex flex-col gap-0.5">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Compute Guarantee & Performance SLA</h4>
          <p className="text-[10px] text-gray-400 leading-normal max-w-3xl font-semibold">
            Computational resource routing is allocated on a rolling weekly basis to guarantee sub-second latency for live campaigns. Unlocked quotas are protected from degradation and guaranteed upon tier activation.
          </p>
        </div>
      </div>

      {error && (
        <LoadError
          title="Couldn't load your subscription"
          error={error}
          onRetry={() => mutate()}
          variant="inline"
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* ── LEFT PANEL: Subscription Status & Credits Quota Meter (1/3) ── */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="border border-glass bg-glass rounded-2xl p-5 shadow-glow relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full blur-2xl" />
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-brand-primary animate-pulse" />
              <h3 className="font-display font-extrabold text-sm text-white uppercase tracking-wider">
                Subscription Status
              </h3>
            </div>

            {isLoading ? (
              <LoadingSkeleton variant="metrics" count={1} />
            ) : (
              <div className="p-4 bg-white/5 border border-glass rounded-xl mb-6">
                <strong className="text-xs text-gray-400 block mb-1">Active Plan Tier:</strong>
                <span className="text-base font-extrabold text-brand-primary">{activePlanName} Plan</span>
                <p className="text-[10px] text-gray-500 font-semibold mt-1">
                  {subscription?.currentPeriodEnd
                    ? `Renews ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                    : "Renewal date unavailable"}
                </p>
              </div>
            )}

            <button
              onClick={handlePortalRedirect}
              disabled={portalLoading || isLoading}
              className="w-full min-h-[40px] rounded-xl border border-glass bg-white/5 hover:bg-white/10 text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 text-white active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{portalLoading ? "Opening portal…" : "Manage Stripe Billing"}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quota meters */}
          {usage && (
            <div className="border border-glass bg-glass rounded-2xl p-5 shadow-glow">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-brand-accent animate-bounce" />
                <h3 className="font-display font-extrabold text-sm text-white uppercase tracking-wider">
                  AI Usage Metrics
                </h3>
              </div>

              <div className="flex flex-col gap-5">
                <UsageMeter
                  label="AI Video Evaluation Credits"
                  used={usage.aiCallsCount}
                  total={usage.limits?.monthlyAiLimit || 100}
                />
                <UsageMeter
                  label="Linked Creator Profiles"
                  used={accounts.length}
                  total={usage.limits?.maxAccounts || 3}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL: Pricing Tiers Grid (2/3) ── */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`border rounded-2xl p-5 bg-glass backdrop-blur-xl flex flex-col justify-between relative transition-all duration-300 ${
                plan.active
                  ? "border-brand-primary shadow-glow"
                  : plan.premium
                  ? "border-brand-accent/50 hover:bg-white/5"
                  : "border-glass hover:bg-white/5"
              }`}
            >
              {plan.premium && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brand-accent text-[8px] font-bold text-white uppercase tracking-widest shadow-md">
                  Most Popular
                </div>
              )}

              <div>
                <h4 className="font-display font-extrabold text-sm text-white mb-1 uppercase tracking-wider">
                  {plan.name}
                </h4>
                <div className="flex items-baseline gap-1 my-3">
                  <strong className="text-3xl font-display font-black text-white">{plan.price}</strong>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">/ Mo</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-normal mb-5">
                  {plan.desc}
                </p>

                {/* Features list */}
                <div className="flex flex-col gap-2.5 pb-6 border-b border-white/5 mb-6">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex gap-2 items-start text-[10px] font-semibold text-gray-300">
                      <Check className="w-3.5 h-3.5 text-brand-secondary shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action upgrade button */}
              <button
                disabled={plan.active || checkoutLoadingPlan === plan.id}
                onClick={() => handleCheckout(plan.id, plan.name)}
                className={`w-full min-h-[38px] rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer ${
                  plan.active
                    ? "bg-white/10 text-gray-400 border border-white/5 cursor-not-allowed"
                    : plan.premium
                    ? "bg-brand-accent text-white shadow-glow hover:opacity-90"
                    : "bg-white/5 hover:bg-white/10 border border-glass text-white"
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {plan.active ? (
                  <Lock className="w-3.5 h-3.5 text-gray-500" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>
                  {checkoutLoadingPlan === plan.id ? "Redirecting…" : plan.cta}
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── BOTTOM ROW: Trust Indicators & FAQ Drawer ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4 pt-4 border-t border-white/5">
        {/* Trust Badges */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="border border-glass bg-glass rounded-2xl p-5 shadow-glow flex flex-col gap-4 select-none">
            <h4 className="font-display font-extrabold text-xs text-white uppercase tracking-wider">
              Encrypted Checkout & Guarantee
            </h4>
            
            <div className="flex flex-col gap-3">
              <div className="flex gap-2.5 items-start text-[10px] font-semibold text-gray-300">
                <Check className="w-3.5 h-3.5 text-brand-secondary shrink-0 mt-0.5" />
                <span>Transparent billing portal access powered by Stripe. Downgrade, upgrade, or cancel your active computational slots instantly with zero lock-in periods.</span>
              </div>
              <div className="flex gap-2.5 items-start text-[10px] font-semibold text-gray-300">
                <Check className="w-3.5 h-3.5 text-brand-secondary shrink-0 mt-0.5" />
                <span>All connections encrypted with AES-256 and verified through secure Meta/Instagram API OAuth.</span>
              </div>
            </div>
            
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[8px] font-bold text-gray-500 uppercase tracking-widest">
              <span>Secure Checkout</span>
              <span>🔒 256-Bit SSL</span>
            </div>
          </div>
        </div>
        
        {/* FAQ Accordion Drawers */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="border border-glass bg-glass rounded-2xl p-5 shadow-glow">
            <h4 className="font-display font-extrabold text-xs text-white uppercase tracking-wider mb-4">
              Computational Objections & Answers
            </h4>
            
            <div className="flex flex-col gap-3.5">
              <FAQItem 
                question="How are AI computational calls calculated?" 
                answer="Each video analysis initiates multiple multi-modal cognitive operations: parsing hooks, extracting frame transitions, scoring skip-resistance against baseline historical vectors, and formulating tactical recommendations. Tiers limit active processing loops to protect network bandwidth."
              />
              <FAQItem 
                question="Can I upgrade or downgrade midway through a cycle?" 
                answer="Yes. All quota changes are handled smoothly through Stripe. Upgrades instantly allocate extra credits to your active dashboard with prorated billing, while downgrades apply to your next rolling cycle window."
              />
              <FAQItem 
                question="What happens to unused credits at the end of the month?" 
                answer="To guarantee resource allocation stability, computational limits do not roll over and are refreshed on your billing cycle anniversary date."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/5 pb-3 last:border-0 last:pb-0 select-none">
      <button 
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center text-left text-[10px] font-bold text-gray-200 hover:text-brand-primary transition-colors cursor-pointer"
      >
        <span>{question}</span>
        <span className="text-xs text-gray-500">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <p className="mt-1.5 text-[9px] leading-relaxed text-gray-400 font-semibold transition-all duration-300">
          {answer}
        </p>
      )}
    </div>
  );
}
