---
name: vite-auth-middleware
description: Professional patterns for building authentication and authorization "middleware" in Vite + React single-page apps — auth context/providers, token storage strategy, HTTP interceptors, protected route guards, and role-based access control (RBAC), including Go/Gin session-cookie backends and Laravel Sanctum/JWT-backed setups. Use this whenever building, reviewing, hardening, or debugging login flows, protected/private routes, session or token handling, 401 handling, refresh tokens, or role-gated pages in a Vite-based frontend — even for requests like "add auth to my app", "protect these routes", "handle 401s", "add roles/permissions", or a login loop / flicker / stale-session bug. Trigger at the start of any new Vite + React project that needs login.
---

# Vite Auth Middleware

## Why this needs care

A Vite/React SPA has no server-side middleware layer of its own — "auth middleware" here really
means five coordinating pieces: where the credential lives, who tracks auth state, how the HTTP
client attaches/reacts to it, how routes get gated, and (if there's more than one user type) how
roles get enforced. Get one piece sloppy and it shows up as a security hole (token stealable via
XSS, roles only checked client-side) or a UX bug (login loops, a flash of protected content
before redirect, parallel refresh calls racing each other). Treat this as one system.

## 1. Token storage — decide this first, it drives everything else

- If the backend can set an **httpOnly cookie**, use it. No token ever touches JS, so it can't be
  read by an injected script or a compromised dependency. This is the default for Go/Gin session
  setups and Laravel Sanctum SPA mode — see the backend sections below.
- If the backend only returns a bearer token in the JSON body, keep the **access token in memory**
  (a variable in React state) — never in `localStorage`/`sessionStorage`. Anything in Web Storage
  is readable by any script running on the page. If there's a refresh token too, prefer it as an
  httpOnly cookie; if it truly can't be, that's a real tradeoff — name it explicitly rather than
  silently writing it to storage.
- Keep access tokens short-lived; let refresh (or, in session mode, a rolling cookie expiry)
  extend the session. Don't trust the client clock for anything security-relevant — a request
  with an expired credential should just get a 401 and go through the normal handling below.

## 2. Auth state — one source of truth, three states not two

Wrap the app in a single `AuthProvider` exposing `user`, a `status` that is explicitly
`"loading" | "authenticated" | "unauthenticated"` (not a boolean), plus `login()`/`logout()`. On
app boot, hit an endpoint like `GET /api/user` to check the existing session/token _before_ the
router decides what to render. Collapsing this to a boolean is the most common bug source: on a
hard refresh, a boolean starts `false` while that check is in flight, so a naive guard either
flashes protected content or bounces the user to `/login` for a split second on every reload.

```tsx
// AuthContext.tsx — session-cookie mode (no client-side token at all)
type AuthStatus = "loading" | "authenticated" | "unauthenticated";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const clearAuth = useCallback(() => {
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<User>("/api/user")
      .then(({ data }) => {
        if (!cancelled) {
          setUser(data);
          setStatus("authenticated");
        }
      })
      .catch(() => {
        if (!cancelled) clearAuth();
      });
    return () => {
      cancelled = true;
    };
  }, [clearAuth]);

  // api client dispatches this on any 401 (see section 3)
  useEffect(() => {
    window.addEventListener("auth:logout", clearAuth);
    return () => window.removeEventListener("auth:logout", clearAuth);
  }, [clearAuth]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await apiClient.post<{ user: User }>("/api/login", {
      email,
      password,
    });
    setUser(data.user);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post("/api/logout");
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  return (
    <AuthContext.Provider value={{ user, status, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
```

## 3. HTTP client interceptor — attach and react

```ts
// api-client.ts — default: httpOnly session cookie. Browser attaches it automatically.
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // required for the cookie to be sent/received cross-origin
});

// 401 in session-cookie mode = the session is gone. Nothing to refresh — clear state, let the
// route guard redirect to /login.
apiClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401)
      window.dispatchEvent(new CustomEvent("auth:logout"));
    return Promise.reject(error);
  },
);
```

If the backend instead hands back a bearer token, attach it via a request interceptor and use a
**shared in-flight refresh promise** on 401 so N concurrent 401s trigger exactly one refresh call,
not N racing ones — this is the single most common bug in hand-rolled bearer-token auth:

```ts
let accessToken: string | null = null;
export const setAccessToken = (t: string | null) => {
  accessToken = t;
};

apiClient.interceptors.request.use((cfg) => {
  if (accessToken) cfg.headers.Authorization = `Bearer ${accessToken}`;
  return cfg;
});

let refreshPromise: Promise<void> | null = null;
apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as any;
    if (error.response?.status !== 401 || original._retried)
      return Promise.reject(error);
    original._retried = true;
    try {
      refreshPromise ??= performRefresh().finally(() => {
        refreshPromise = null;
      });
      await refreshPromise;
      return apiClient(original); // replay with the fresh token
    } catch (e) {
      setAccessToken(null);
      window.dispatchEvent(new CustomEvent("auth:logout"));
      return Promise.reject(e);
    }
  },
);
```

## 4. Route guards — respect the "still checking" state

```tsx
// ProtectedRoute.tsx
export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === "loading") return <div>Checking session…</div>;
  if (status === "unauthenticated")
    return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
}

// Inverse guard: keep a logged-in user off /login, /register
export function PublicOnlyRoute() {
  const { status } = useAuth();
  if (status === "loading") return <div>Checking session…</div>;
  if (status === "authenticated") return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
```

Capture the attempted location before redirecting so login can send the user back:
`navigate(location.state?.from?.pathname ?? "/dashboard", { replace: true })`.

## 5. Role-based access control (RBAC)

Relevant once there's more than one user type (student/teacher/parent/staff-style apps,
admin-vs-member, etc.). **Client-side role gates are a UX convenience, not a security boundary —
always enforce roles server-side too.** Say this plainly if a request implies the frontend gate
alone is enough; it's the most common professional mistake in this area.

```tsx
// RequireRole.tsx — stack after ProtectedRoute
export function RequireRole({
  role,
  redirectTo = "/",
}: {
  role: string | string[];
  redirectTo?: string;
}) {
  const { user } = useAuth();
  const allowed = Array.isArray(role) ? role : [role];
  if (!user?.role || !allowed.includes(user.role))
    return <Navigate to={redirectTo} replace />;
  return <Outlet />;
}

export function useHasRole(role: string | string[]): boolean {
  const { user } = useAuth();
  const allowed = Array.isArray(role) ? role : [role];
  return !!user?.role && allowed.includes(user.role);
}
```

Derive the role from the same `user` object `AuthContext` already holds — don't re-fetch or
re-derive it separately, or the two can drift.

## Backend: Go + Gin (httpOnly session cookies)

```go
store := cookie.NewStore([]byte(sessionSecret)) // or redis.NewStore(...) for server-side revocation
store.Options(sessions.Options{
    Path: "/", MaxAge: int((7 * 24 * time.Hour).Seconds()),
    HttpOnly: true, Secure: true, SameSite: http.SameSiteLaxMode,
})
r.Use(sessions.Sessions("session", store))

r.Use(cors.New(cors.Config{
    AllowOrigins: []string{"http://localhost:5173"}, // exact origin, never "*"
    AllowCredentials: true,
    AllowMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
}))

func RequireAuth() gin.HandlerFunc {
    return func(c *gin.Context) {
        session := sessions.Default(c)
        if session.Get("user_id") == nil {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthenticated"})
            return
        }
        c.Next()
    }
}
// Login: session.Clear(); session.Set("user_id", user.ID); session.Save()  — Clear() first avoids session fixation
// Logout: session.Clear(); session.Save()  — this is what actually invalidates it server-side
```

`cookie.NewStore` is fine for solo/early projects but caps around 4KB and can't revoke one
session without invalidating everyone's — use `redis.NewStore` once that matters. **Gin has no
Sanctum-style built-in CSRF protection.** `SameSite=Lax` covers most cases when frontend and API
share a registered domain; if the setup needs `SameSite=None` (fully separate domains), add an
explicit CSRF token check rather than relying on `SameSite` alone — flag this if you see
`SameSite=None` with no CSRF check anywhere. No refresh endpoint is needed for sessions; for a
rolling expiry, call `session.Save()` on every authenticated request to reset the cookie's `MaxAge`.

## Backend: Laravel

- **Sanctum SPA (cookie) mode** — same httpOnly-cookie path as above. `SANCTUM_STATEFUL_DOMAINS`
  must include the frontend origin; `withCredentials: true` on every request; GET
  `/sanctum/csrf-cookie` before the first login/register POST in a session (axios sends the
  resulting `XSRF-TOKEN` back automatically as `X-XSRF-TOKEN`; a bare `fetch` wrapper needs to do
  this by hand). Skipping the CSRF-cookie step is the most common "419 mismatch" bug.
- **Bearer JWT mode** (`tymon/jwt-auth` or similar) — use the bearer-token block in section 3.
  Default TTL is often short (~60 min); confirm the real value server-side rather than assuming.
- Either mode: logout must call the backend logout endpoint (invalidates server-side), not just
  clear frontend state — otherwise a stolen cookie/token stays valid. 422/419 responses are
  validation/CSRF errors, not auth failures — don't route them through 401 handling.

## Reviewing existing auth code

Check for: access tokens in `localStorage`/`sessionStorage` without that tradeoff being a
deliberate, named choice · a 401 handler with no shared in-flight refresh promise (parallel
refresh calls racing) · guard components rendering `children` before the auth check resolves ·
role checks that exist only in the frontend with no server-side counterpart · a token/session
reference that survives logout in the HTTP client, not just in UI state · missing
`withCredentials`/`credentials: "include"` or a missing CSRF step on a cookie-based backend. Fix
the specific thing found — don't rewrite the whole auth system unless asked to.
