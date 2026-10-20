import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";
import { listPaintings } from "@/api/paintingsApi";
import { PaintingCard } from "@/components/PaintingCard";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutationsEnabled } from "@/lib/config";
import { errorMessage } from "@/lib/errors";
import { useApi } from "@/lib/useApi";

const SEARCH_DEBOUNCE_MS = 300;

export function PaintingListPage() {
  const mutationsEnabled = useMutationsEnabled();
  const [searchParams, setSearchParams] = useSearchParams();
  const title = searchParams.get("title") ?? "";
  const [query, setQuery] = useState(title);

  // Keep the input in sync when the URL changes (back/forward navigation).
  useEffect(() => setQuery(title), [title]);

  const applySearch = (value: string) => {
    const trimmed = value.trim();
    if (trimmed === title) return;
    setSearchParams(trimmed ? { title: trimmed } : {}, { replace: true });
  };

  useEffect(() => {
    const timer = window.setTimeout(() => applySearch(query), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  const { state, retry } = useApi((signal) => listPaintings(title, signal), [title]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    applySearch(query);
  };

  return (
    <section aria-labelledby="catalogue-heading">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 id="catalogue-heading" className="text-3xl font-semibold sm:text-4xl">
            Paintings
          </h1>
          <p className="mt-1 text-muted-foreground">Original works, ready to hang.</p>
        </div>
        <form role="search" onSubmit={handleSubmit} className="flex w-full gap-2 sm:max-w-sm">
          <label htmlFor="painting-search" className="sr-only">
            Search paintings by title
          </label>
          <div className="relative flex-1">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="painting-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title"
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>
      </div>

      {state.status === "loading" && <LoadingState label="Loading paintings…" />}

      {state.status === "error" && (
        <ErrorState title="Couldn't load paintings" message={errorMessage(state.error)} onRetry={retry} />
      )}

      {state.status === "success" && state.data.length === 0 && (
        title ? (
          <EmptyState title={`No paintings match “${title}”`}>
            <p className="text-muted-foreground">Try a different title, or clear the search.</p>
            <Button variant="outline" onClick={() => setQuery("")}>
              <X aria-hidden="true" />
              Clear search
            </Button>
          </EmptyState>
        ) : (
          <EmptyState title="No paintings yet">
            <p className="text-muted-foreground">The catalogue is empty right now.</p>
            {mutationsEnabled && (
              <Button asChild>
                <Link to="/paintings/new">Add the first painting</Link>
              </Button>
            )}
          </EmptyState>
        )
      )}

      {state.status === "success" && state.data.length > 0 && (
        <>
          <p role="status" className="mb-4 text-sm text-muted-foreground">
            {state.data.length} {state.data.length === 1 ? "painting" : "paintings"}
            {title && <> matching “{title}”</>}
          </p>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {state.data.map((painting) => (
              <li key={painting.id} className="flex">
                <div className="w-full">
                  <PaintingCard painting={painting} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
