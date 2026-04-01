import React, { useState } from "react";
import { Crown, LogOut, LogIn, ExternalLink, Loader2, ArrowLeft, CreditCard } from "lucide-react";
import { cn } from "./lib/utils";

interface AccountPanelProps {
  signedIn: boolean;
  plan: string;
  user: { email: string; full_name: string } | null;
  isLoading: boolean;
  onSignIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onSignOut: () => void;
  onUpgrade: () => void;
  onManageBilling?: () => void;
}

const PLAN_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  free: { label: "Free", color: "text-foreground/60", bg: "bg-foreground/8" },
  pro: { label: "Pro", color: "text-violet-500", bg: "bg-violet-500/10" },
  business: { label: "Business", color: "text-amber-500", bg: "bg-amber-500/10" },
  enterprise: { label: "Enterprise", color: "text-emerald-500", bg: "bg-emerald-500/10" },
};

export default function AccountPanel({
  signedIn,
  plan,
  user,
  isLoading,
  onSignIn,
  onSignOut,
  onUpgrade,
  onManageBilling,
}: AccountPanelProps) {
  const planInfo = PLAN_CONFIG[plan] || PLAN_CONFIG.free;
  const isPaid = plan !== "free";
  const [showForm, setShowForm] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  if (isLoading) {
    return (
      <div className="px-2.5 py-2">
        <div className="h-8 rounded-md bg-foreground/5 animate-pulse" />
      </div>
    );
  }

  if (!signedIn && showForm && showForgot) {
    return (
      <div className="px-2 pb-1">
        <div className="rounded-lg border border-border/20 bg-foreground/3 dark:bg-white/3 p-3">
          <div className="flex items-center gap-1.5 mb-3">
            <button
              onClick={() => { setShowForgot(false); setError(""); setResetSent(false); }}
              className="p-0.5 rounded text-foreground/40 hover:text-foreground/70 transition-colors"
            >
              <ArrowLeft size={13} />
            </button>
            <span className="text-xs font-medium">Reset password</span>
          </div>

          {resetSent ? (
            <p className="text-[11px] text-foreground/60 text-center py-2">
              Check your email for a password reset link.
            </p>
          ) : (
            <>
              {error && (
                <div className="mb-2 px-2 py-1.5 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-[11px]">
                  {error}
                </div>
              )}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setError("");
                  setSubmitting(true);
                  try {
                    const result = await window.electronAPI?.licenseResetPassword?.(email);
                    if (result?.success) {
                      setResetSent(true);
                    } else {
                      setError(result?.error || "Failed to send reset email");
                    }
                  } catch {
                    setError("Failed to send reset email");
                  }
                  setSubmitting(false);
                }}
                className="space-y-2"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  className="w-full h-7 px-2 rounded-md text-xs bg-background border border-border/30 dark:border-white/10 text-foreground placeholder:text-foreground/30 outline-none focus:border-primary/40 transition-colors"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-7 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {submitting ? <Loader2 size={12} className="animate-spin" /> : null}
                  {submitting ? "Sending..." : "Send reset link"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!signedIn && showForm) {
    return (
      <div className="px-2 pb-1">
        <div className="rounded-lg border border-border/20 bg-foreground/3 dark:bg-white/3 p-3">
          <div className="flex items-center gap-1.5 mb-3">
            <button
              onClick={() => { setShowForm(false); setError(""); }}
              className="p-0.5 rounded text-foreground/40 hover:text-foreground/70 transition-colors"
            >
              <ArrowLeft size={13} />
            </button>
            <span className="text-xs font-medium">Sign in to Neato Dictate</span>
          </div>

          {error && (
            <div className="mb-2 px-2 py-1.5 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-[11px]">
              {error}
            </div>
          )}

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              setSubmitting(true);
              const result = await onSignIn(email, password);
              if (!result.success) {
                setError(result.error || "Sign in failed");
              } else {
                setShowForm(false);
                setEmail("");
                setPassword("");
              }
              setSubmitting(false);
            }}
            className="space-y-2"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full h-7 px-2 rounded-md text-xs bg-background border border-border/30 dark:border-white/10 text-foreground placeholder:text-foreground/30 outline-none focus:border-primary/40 transition-colors"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full h-7 px-2 rounded-md text-xs bg-background border border-border/30 dark:border-white/10 text-foreground placeholder:text-foreground/30 outline-none focus:border-primary/40 transition-colors"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-7 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {submitting ? <Loader2 size={12} className="animate-spin" /> : <LogIn size={12} />}
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="flex items-center justify-between mt-2">
            <button
              type="button"
              onClick={() => { setShowForgot(true); setError(""); setResetSent(false); }}
              className="text-[10px] text-foreground/35 hover:text-foreground/55 transition-colors"
            >
              Forgot password?
            </button>
            <a
              href="https://neato-dictate-web.vercel.app/auth/signup"
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-primary/60 hover:text-primary/80"
            >
              Create account
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className="px-2 pb-1">
        <button
          onClick={() => setShowForm(true)}
          className="group flex items-center gap-2.5 w-full h-9 px-2.5 rounded-lg text-left outline-none bg-primary/8 hover:bg-primary/12 dark:bg-primary/10 dark:hover:bg-primary/15 border border-primary/20 transition-colors duration-150"
        >
          <LogIn size={15} className="shrink-0 text-primary" />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-primary">Sign in</span>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="px-2 pb-1 space-y-1.5">
      {/* User info + plan badge */}
      <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md">
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-xs font-semibold text-primary">
            {(user?.full_name?.[0] || user?.email?.[0] || "U").toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-xs text-foreground/80 truncate leading-tight">
              {user?.full_name || "User"}
            </p>
            <span
              className={cn(
                "inline-flex items-center gap-0.5 px-1.5 py-px rounded-full text-[10px] font-medium shrink-0",
                planInfo.bg,
                planInfo.color
              )}
            >
              {isPaid && <Crown size={9} />}
              {planInfo.label}
            </span>
          </div>
          <p className="text-[11px] text-foreground/45 truncate leading-tight">
            {user?.email}
          </p>
        </div>
      </div>

      {/* Upgrade button for free users */}
      {!isPaid && (
        <button
          onClick={onUpgrade}
          className="group flex items-center gap-2 w-full h-8 px-2.5 rounded-md text-left outline-none bg-gradient-to-r from-violet-500/10 to-amber-500/10 hover:from-violet-500/15 hover:to-amber-500/15 border border-violet-500/20 transition-all duration-200"
        >
          <Crown size={13} className="shrink-0 text-violet-500" />
          <span className="text-xs font-medium text-violet-500 flex-1">Upgrade to Pro</span>
          <ExternalLink size={11} className="shrink-0 text-violet-500/50" />
        </button>
      )}

      {/* Billing portal for paid users */}
      {isPaid && onManageBilling && (
        <button
          onClick={onManageBilling}
          className="group flex items-center gap-2 w-full h-7 px-2.5 rounded-md text-left outline-none hover:bg-foreground/4 dark:hover:bg-white/4 transition-colors duration-150"
        >
          <CreditCard size={13} className="shrink-0 text-foreground/40 group-hover:text-foreground/60" />
          <span className="text-[11px] text-foreground/40 group-hover:text-foreground/60 transition-colors">
            Manage subscription
          </span>
          <ExternalLink size={10} className="shrink-0 ml-auto text-foreground/25 group-hover:text-foreground/40" />
        </button>
      )}

      {/* Sign out */}
      <button
        onClick={onSignOut}
        className="group flex items-center gap-2.5 w-full h-7 px-2.5 rounded-md text-left outline-none hover:bg-foreground/4 dark:hover:bg-white/4 transition-colors duration-150"
      >
        <LogOut size={13} className="shrink-0 text-foreground/40 group-hover:text-foreground/60" />
        <span className="text-[11px] text-foreground/40 group-hover:text-foreground/60 transition-colors">
          Sign out
        </span>
      </button>
    </div>
  );
}
