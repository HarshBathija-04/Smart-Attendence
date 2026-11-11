import { lazy, Suspense, useEffect, type ComponentType, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { AppShell, WakeBanner } from "./components/layout";
import { ButtonLink, Skeleton } from "./components/ui";
import { AuthProvider, useAuth } from "./lib/auth";
import Landing from "./pages/Landing";
import Login from "./pages/Login";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const CheckIn = lazy(() => import("./pages/CheckIn"));
const Roster = lazy(() => import("./pages/Roster"));
const Students = lazy(() => import("./pages/Students"));
const Classes = lazy(() => import("./pages/Classes"));
const Reports = lazy(() => import("./pages/Reports"));

const titles: Record<string, string> = {
  "/": "Smart Attendance | Face recognition attendance for classrooms",
  "/login": "Sign in | Smart Attendance",
  "/app": "Overview | Smart Attendance",
  "/app/check-in": "Face check-in | Smart Attendance",
  "/app/roster": "Roster | Smart Attendance",
  "/app/students": "Students | Smart Attendance",
  "/app/classes": "Classes | Smart Attendance",
  "/app/reports": "Reports | Smart Attendance",
};

function DocumentTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = titles[pathname] ?? "Smart Attendance";
  }, [pathname]);
  return null;
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();
  useEffect(() => {
    const onExpired = () => toast.error("Your session expired. Please sign in again.");
    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, []);
  if (status === "checking")
    return (
      <div className="grid min-h-dvh place-items-center" aria-busy>
        <span className="sr-only">Checking your session</span>
        <Skeleton className="h-2 w-40" />
      </div>
    );
  if (status === "signed-out")
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return children;
}

function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <p className="font-mono text-sm text-accent-ink">404</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">This page isn’t on the register</h1>
        <p className="mt-2 text-sm text-muted">The link may be old or mistyped.</p>
        <ButtonLink to="/" className="mt-6">
          Go home
        </ButtonLink>
      </div>
    </div>
  );
}

function Page({ component: Component }: { component: ComponentType }) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4" aria-busy>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64" />
        </div>
      }
    >
      <Component />
    </Suspense>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DocumentTitle />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/app"
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route index element={<Page component={Dashboard} />} />
            <Route path="check-in" element={<Page component={CheckIn} />} />
            <Route path="roster" element={<Page component={Roster} />} />
            <Route path="students" element={<Page component={Students} />} />
            <Route path="classes" element={<Page component={Classes} />} />
            <Route path="reports" element={<Page component={Reports} />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        <WakeBanner />
        <Toaster position="top-right" richColors closeButton toastOptions={{ className: "font-sans" }} />
      </AuthProvider>
    </BrowserRouter>
  );
}
