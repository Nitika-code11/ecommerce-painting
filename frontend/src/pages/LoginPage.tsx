import { useId, useState, type FormEvent } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { login } from "@/api/authApi";
import { ApiError } from "@/api/http";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setToken, useAuth } from "@/lib/auth";

/** Only same-site paths may be used as a post-login destination (blocks open redirects like //evil.test). */
function safeDestination(next: string | null): string {
  // Must start with a single "/" (a path on this site), not "//host" (protocol-relative) and not a login loop.
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/login") ? next : "/paintings";
}

/** Sign-in screen. On success the token is stored and the user is sent where they were heading (?next=). */
export function LoginPage() {
  const [searchParams] = useSearchParams();
  const destination = safeDestination(searchParams.get("next"));
  const navigate = useNavigate();
  const { user } = useAuth();
  const idPrefix = useId(); // unique ids for the label/input pairs
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already signed in: nothing to do here, go straight on.
  if (user) return <Navigate to={destination} replace />;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    if (!username.trim() || !password) {
      setError("Enter your username and password.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      setToken(await login(username.trim(), password)); // keep the token; the rest of the app sees it immediately
      navigate(destination, { replace: true });           // replace: Back won't return to the login form
    } catch (err) {
      setError(
        // 401 = wrong credentials; show a clear message. Other errors use the generic safe messages.
        err instanceof ApiError && err.status === 401
          ? "Incorrect username or password."
          : err instanceof ApiError
            ? err.message
            : "Something went wrong. Please try again.",
      );
      setSubmitting(false);
    }
  };

  return (
    <section aria-labelledby="login-heading" className="mx-auto max-w-sm py-8">
      <h1 id="login-heading" className="text-3xl font-semibold">
        Sign in
      </h1>
      <p className="mt-1 text-muted-foreground">Administrators can add, edit and delete paintings.</p>
      <form onSubmit={handleSubmit} noValidate className="mt-6 grid gap-5" aria-busy={submitting}>
        {error && (
          <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}-username`}>Username</Label>
          <Input
            id={`${idPrefix}-username`}
            name="username"
            autoComplete="username" // lets password managers fill it in
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={submitting}
            autoFocus
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}-password`}>Password</Label>
          <Input
            id={`${idPrefix}-password`}
            name="password"
            type="password" // masks the characters
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
          />
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 aria-hidden="true" className="animate-spin" />}
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </section>
  );
}
