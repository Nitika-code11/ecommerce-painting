import { Link, NavLink, Outlet } from "react-router-dom";
import { Palette, Plus } from "lucide-react";
import { useMutationsEnabled } from "@/lib/config";
import { Button } from "./ui/button";
import { Notice } from "./Notice";

export function Layout() {
  const mutationsEnabled = useMutationsEnabled();
  return (
    <div className="flex min-h-svh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-2 focus:shadow"
      >
        Skip to content
      </a>
      <header className="border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link
            to="/paintings"
            className="flex items-center gap-2 rounded-md font-serif text-xl font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Palette aria-hidden="true" className="size-6 text-primary" />
            Painting Store
          </Link>
          <nav aria-label="Main" className="flex items-center gap-2">
            <NavLink
              to="/paintings"
              end
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive ? "underline underline-offset-4" : ""}`
              }
            >
              Catalogue
            </NavLink>
            {mutationsEnabled && (
              <Button asChild size="sm">
                <Link to="/paintings/new">
                  <Plus aria-hidden="true" />
                  <span>Add painting</span>
                </Link>
              </Button>
            )}
          </nav>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 outline-none">
        <Notice />
        <Outlet />
      </main>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">Painting Store · catalogue MVP</footer>
    </div>
  );
}
