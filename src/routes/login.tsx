import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { GlassNavbar } from "@/components/marketing/GlassNavbar";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [{ title: "Sign in — LegalPak" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isPending && user) navigate({ to: "/dashboard" });
  }, [isPending, user, navigate]);

  if (!isPending && user) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await authClient.signIn.email({ email, password });
    setSubmitting(false);
    if (error) {
      toast.error(error.message ?? "Sign-in failed");
      return;
    }
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="marketing-surface flex min-h-screen flex-col bg-bg">
      <GlassNavbar />
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center space-y-6 px-6 py-16">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">LegalPak Workspace</p>
          <h1 className="mt-2 font-display text-3xl text-fg">Sign in</h1>
        </div>
        <form
          onSubmit={submit}
          className="space-y-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-sm"
        >
          <Field label="Email">
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <p className="text-center text-sm text-muted">
          No workspace yet?{" "}
          <Link to="/signup" className="font-medium text-accent underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
