import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Bus, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn, signUp, requestPasswordReset, useAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Admin Login — SoniaBuddy" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (!loading && user && isAdmin) {
      navigate({ to: "/admin" });
    }
  }, [loading, user, isAdmin, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
        // Force redirect to admin dashboard immediately on success.
        navigate({ to: "/admin" });
      } else {
        await signUp(email, password);
        setInfo(
          "Account created. If email confirmation is enabled, check your inbox. An admin must grant your account the 'admin' role before you can access /admin."
        );
        setMode("signin");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setSubmitting(false);
    }
  };

  const onForgotPassword = async () => {
    setError(null);
    setInfo(null);
    if (!email) {
      setError("Enter your email above first, then click 'Forgot password'.");
      return;
    }
    setResetting(true);
    try {
      await requestPasswordReset(email);
      setInfo(`Password reset email sent to ${email}. Check your inbox.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset request failed");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-orange-gradient flex items-center justify-center shadow-glow">
            <Bus className="w-6 h-6 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <div className="font-bold text-lg">Sonia<span className="text-gradient-orange">Buddy</span></div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Admin Portal</div>
          </div>
        </Link>

        <div className="bg-card-gradient border border-border rounded-3xl p-8 shadow-elegant">
          <div className="flex items-center gap-2 mb-6">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold">
              {mode === "signin" ? "Admin sign in" : "Create account"}
            </h1>
          </div>

          {!isSupabaseConfigured && (
            <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
              Supabase is not configured.
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">Email</label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="h-11 rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">Password</label>
              <Input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 rounded-xl"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive-foreground">
                {error}
              </div>
            )}

            {info && (
              <div className="rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 text-sm">
                {info}
              </div>
            )}

            {mode === "signin" && user && !isAdmin && !loading && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm">
                Signed in, but this account does not have the <strong>admin</strong> role.
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting || !isSupabaseConfigured}
              className="w-full h-11 rounded-xl bg-orange-gradient text-primary-foreground font-semibold shadow-glow hover:opacity-95"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : mode === "signin" ? (
                "Sign in"
              ) : (
                "Create account"
              )}
            </Button>

            {mode === "signin" && (
              <button
                type="button"
                onClick={onForgotPassword}
                disabled={resetting}
                className="w-full text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                {resetting ? "Sending reset email..." : "Forgot password?"}
              </button>
            )}
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                    setInfo(null);
                  }}
                  className="font-semibold text-primary hover:underline"
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError(null);
                    setInfo(null);
                  }}
                  className="font-semibold text-primary hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </div>

          <p className="mt-4 text-xs text-muted-foreground text-center">
            Protected area. Roles enforced via Supabase RLS.
          </p>
        </div>
      </div>
    </div>
  );
}
