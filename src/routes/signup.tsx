import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { GlassNavbar } from "@/components/marketing/GlassNavbar";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  head: () => ({
    meta: [{ title: "Create account — LegalPak" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});

function SignupPage() {
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isPending && user) navigate({ to: "/dashboard" });
  }, [isPending, user, navigate]);

  if (!isPending && user) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setSubmitting(true);
    const { error } = await authClient.signUp.email({ name, email, password });
    setSubmitting(false);
    if (error) {
      toast.error(error.message ?? "Could not create account");
      return;
    }
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="luxury flex min-h-screen flex-col">
      <GlassNavbar />
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center space-y-6 px-6 pt-32 pb-24">
        <div>
          <p className="text-xs font-medium tracking-[0.3em] text-[var(--lux-bronze)] uppercase">
            LegalPak Workspace
          </p>
          <h1
            className="mt-2 text-3xl text-[var(--lux-fg)]"
            style={{ fontFamily: "var(--font-lux-serif)" }}
          >
            Create your account
          </h1>
        </div>
        <form
          onSubmit={submit}
          className="space-y-4 rounded-2xl border border-[var(--lux-border)] bg-white/[0.03] p-5 backdrop-blur-md"
        >
          <Field label="Full name">
            <Input required value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Email">
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Creating…" : "Create account"}
          </Button>
        </form>
        <p className="text-center text-sm text-[var(--lux-muted)]">
          Already have a workspace?{" "}
          <Link to="/login" className="font-medium text-[var(--lux-gold)] underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
