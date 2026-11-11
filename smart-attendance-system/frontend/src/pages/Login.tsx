import { AlertCircle, ArrowLeft } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "../components/layout";
import { Button, Field } from "../components/ui";
import { ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";

export default function Login() {
  const { login, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/app";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (status === "signed-in") return <Navigate to={from} replace />;

  const submit = async (e?: FormEvent, creds = { username, password }) => {
    e?.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(creds.username, creds.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sign in failed, please try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="ruled hidden border-r border-line lg:flex lg:flex-col lg:justify-between lg:p-10">
        <Logo />
        <div className="max-w-md">
          <p className="font-display text-3xl font-semibold leading-tight tracking-tight">
            Finish the register before the first slide is up.
          </p>
          <p className="mt-4 text-sm text-muted">Face check-in, class rosters and reports in one place.</p>
        </div>
        <p className="text-sm text-muted">Demo data resets itself and is safe to change.</p>
      </div>

      <div className="flex flex-col px-4 py-6 sm:px-6">
        <Link to="/" className="inline-flex w-fit items-center gap-1.5 rounded text-sm text-muted hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden /> Back to home
        </Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <div className="lg:hidden">
            <Logo />
          </div>
          <h1 className="mt-8 font-display text-3xl font-semibold tracking-tight lg:mt-0">Sign in</h1>
          <p className="mt-1 text-sm text-muted">Use your teacher account to open the register.</p>

          {error && (
            <div
              role="alert"
              className="mt-6 flex items-start gap-2 rounded border border-absent/30 bg-absent-soft px-3 py-2.5 text-sm text-absent"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden /> {error}
            </div>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4" noValidate={false}>
            <Field label="Username">
              {(p) => (
                <input
                  {...p}
                  className="input"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              )}
            </Field>
            <Field label="Password">
              {(p) => (
                <input
                  {...p}
                  type="password"
                  className="input"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              )}
            </Field>
            <Button type="submit" className="w-full" loading={busy}>
              Sign in
            </Button>
          </form>

          <div className="mt-6 rounded border border-dashed border-line p-4 text-sm">
            <p className="font-medium">Just looking around?</p>
            <p className="mt-0.5 text-muted">
              Use the demo account <code className="font-mono text-ink">teacher</code> /{" "}
              <code className="font-mono text-ink">demo1234</code>.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              disabled={busy}
              onClick={() => {
                const creds = { username: "teacher", password: "demo1234" };
                setUsername(creds.username);
                setPassword(creds.password);
                void submit(undefined, creds);
              }}
            >
              Sign in with demo account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
