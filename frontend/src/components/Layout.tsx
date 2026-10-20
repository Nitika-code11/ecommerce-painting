import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogIn, LogOut, Palette, Plus } from "lucide-react";
import { clearToken, useAuth, useCanManage } from "@/lib/auth";
import { useMutationsEnabled } from "@/lib/config";
import { Button } from "./ui/button";
import { Notice } from "./Notice";

/**
 * The frame shared by every page: skip link, header with navigation and sign-in/out, the page itself
 * (rendered by <Outlet />), and the footer.
 */
export function Layout() {
  const mutationsEnabled = useMutationsEnabled(); // is sign-in / management available at all in this environment?
  const canManage = useCanManage();               // mutationsEnabled AND the current user is an administrator
  const { user } = useAuth();                     // the signed-in user, or null for guests
  const navigate = useNavigate();

  /** Signing out only has to forget the token; the server keeps no session. */
  const handleSignOut = () => {
    clearToken();
    navigate("/paintings");
  };

  return (
    <div className="flex min-h-svh flex-col">
      {/* "Skip to content": hidden until a keyboard user tabs to it, then lets them bypass the navigation. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-2 focus:shadow"
      >
        Skip to content
      </a>
      <header className="border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          {/* Logo / home link */}
          <Link
            to="/paintings"
            className="flex items-center gap-2 rounded-md font-serif text-xl font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Palette aria-hidden="true" className="size-6 text-primary" />
            Painting Store
          </Link>
          <nav aria-label="Main" className="flex items-center gap-2">
            {/* NavLink knows whether it matches the current URL, so the active page can be underlined. */}
            <NavLink
              to="/paintings"
              end
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive ? "underline underline-offset-4" : ""}`
              }
            >
              Catalogue
            </NavLink>
            {/* Administrators only: shortcut to the create form. */}
            {canManage && (
              <Button asChild size="sm">
                <Link to="/paintings/new">
                  <Plus aria-hidden="true" />
                  <span>Add painting</span>
                </Link>
              </Button>
            )}
            {/* Sign in / out (hidden entirely in read-only deployments). */}
            {mutationsEnabled &&
              (user ? (
                <>
                  <span className="hidden text-sm text-muted-foreground sm:inline">{user.username}</span>
                  <Button variant="ghost" size="sm" onClick={handleSignOut}>
                    <LogOut aria-hidden="true" />
                    <span>Sign out</span>
                  </Button>
                </>
              ) : (
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">
                    <LogIn aria-hidden="true" />
                    <span>Sign in</span>
                  </Link>
                </Button>
              ))}
          </nav>
        </div>
      </header>
      {/* tabIndex=-1 lets the skip link move keyboard focus here. */}
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 outline-none">
        <Notice /> {/* one-off confirmation such as "Painting was added" */}
        <Outlet /> {/* the page chosen by the router renders here */}
      </main>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">Painting Store · catalogue MVP</footer>
    </div>
  );
}
