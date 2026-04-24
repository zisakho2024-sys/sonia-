import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Bus, Loader2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updatePassword, useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — SoniaBuddy" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState(false);

  // Supabase parses the recovery token from the URL hash automatically and
  // emits a PASSWORD_RECOVERY event. We listen for it so the user knows the
  // link is valid before submitting a new password.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setRecoveryReady(true);
      }
    });
    // If the user is already in a session (e.g. landed here from settings),
    // they can change their password directly.
    if (user) setRecoveryReady(true);
    return () => sub.subscription.unsubscribe();
  }, [user]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await updatePassword(password);
      setSuccess(true);
      setTimeout(() => navigate({ to: "/admin" }), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSubmitting(false);
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
            <div className="font-bold text-lg">
              Sonia<span className="text-gradient-orange">Buddy</span>
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Admin Portal
            </div>
          </div>
        </Link>

        <div className="bg-card-gradient border border-border rounded-3xl p-8 shadow-elegant">
          <div className="flex items-center gap-2 mb-6">
            <KeyRound className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold">Set a new password</h1>
          </div>

          {loading && !recoveryReady && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          )}

          {!loading && !recoveryReady && !user && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
              No active recovery session. Open the password-reset link from
              your email, or{" "}
              <Link to="/admin/login" className="font-semibold underline">
                go back to sign in
              </Link>
              .
            </div>
          )}

          {(recoveryReady || user) && !success && (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">
                  New password
                </label>
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
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">
                  Confirm password
                </label>
                <Input
                  type="password"
                  required
                  minLength={6}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 rounded-xl"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-11 rounded-xl bg-orange-gradient text-primary-foreground font-semibold shadow-glow hover:opacity-95"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Update password"
                )}
              </Button>
            </form>
          )}

          {success && (
            <div className="rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm">
              Password updated. Redirecting to the admin dashboard…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
