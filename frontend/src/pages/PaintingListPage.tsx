import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { listPaintings } from "@/api/paintingsApi";
import { PaintingCard } from "@/components/PaintingCard";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCanManage } from "@/lib/auth";
import { errorMessage } from "@/lib/errors";
import { useApi } from "@/lib/useApi";

/** How long to wait after the last keystroke before searching. */
const SEARCH_DEBOUNCE_MS = 300;

/**
 * The catalogue: a searchable, paged grid of paintings. The current search text and page live in the URL
 * (?title=...&page=2), so the page can be bookmarked, shared, and works with the browser's Back button.
 */
export function PaintingListPage() {
  const canManage = useCanManage();
  const [searchParams, setSearchParams] = useSearchParams();
  const title = searchParams.get("title") ?? "";
  // The URL uses 1-based page numbers; the API is 0-based.
  const pageNumber = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  // What is currently typed in the search box (may be ahead of the URL while the user is still typing).
  const [query, setQuery] = useState(title);

  // Keep the input in sync when the URL changes (back/forward navigation).
  useEffect(() => setQuery(title), [title]);

  /** Puts the search text into the URL. A new search always starts again from page 1 (page is dropped). */
  const applySearch = (value: string) => {
    const trimmed = value.trim();
    if (trimmed === title) return;
    setSearchParams(trimmed ? { title: trimmed } : {}, { replace: true });
  };

  // Debounce: search 300 ms after typing stops, instead of on every keystroke.
  useEffect(() => {
    const timer = window.setTimeout(() => applySearch(query), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  /** Moves to a page (1-based), keeping the search text, and scrolls back to the top. */
  const goToPage = (target: number) => {
    const params: Record<string, string> = {};
    if (title) params.title = title;
    if (target > 1) params.page = String(target);
    setSearchParams(params);
    window.scrollTo({ top: 0 });
  };

  // Loads data whenever the search or page changes; `state` is loading, success (with data) or error.
  const { state, retry } = useApi((signal) => listPaintings({ title, page: pageNumber - 1 }, signal), [title, pageNumber]);

  /** Pressing Enter / clicking Search applies the text immediately, without waiting for the debounce. */
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    applySearch(query);
  };

  return (
    <section aria-labelledby="catalogue-heading">
      {/* Heading and search box */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 id="catalogue-heading" className="text-3xl font-semibold sm:text-4xl">
            Paintings
          </h1>
          <p className="mt-1 text-muted-foreground">Original works, ready to hang.</p>
        </div>
        <form role="search" onSubmit={handleSubmit} className="flex w-full gap-2 sm:max-w-sm">
          {/* Visually hidden label so screen readers know what the field is for. */}
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

      {/* One of the following blocks shows, depending on the request state and the data. */}

      {/* Request in flight */}
      {state.status === "loading" && <LoadingState label="Loading paintings…" />}

      {/* Request failed (with a retry button) */}
      {state.status === "error" && (
        <ErrorState title="Couldn't load paintings" message={errorMessage(state.error)} onRetry={retry} />
      )}

      {/* The URL asked for a page past the end (e.g. ?page=99): there are results, just not here. */}
      {state.status === "success" && state.data.content.length === 0 && state.data.totalElements > 0 && (
        <EmptyState title="That page doesn't exist">
          <p className="text-muted-foreground">There are only {state.data.totalPages} pages of results.</p>
          <Button variant="outline" onClick={() => goToPage(1)}>
            Back to the first page
          </Button>
        </EmptyState>
      )}

      {/* No results at all: either the search matched nothing, or the catalogue is empty. */}
      {state.status === "success" && state.data.totalElements === 0 && (
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
            {/* Only administrators are offered the way to fix an empty catalogue. */}
            {canManage && (
              <Button asChild>
                <Link to="/paintings/new">Add the first painting</Link>
              </Button>
            )}
          </EmptyState>
        )
      )}

      {/* Results: a count, the grid of cards, and page controls when there is more than one page. */}
      {state.status === "success" && state.data.content.length > 0 && (
        <>
          {/* role="status" makes screen readers announce the new count after each search. */}
          <p role="status" className="mb-4 text-sm text-muted-foreground">
            {state.data.totalElements} {state.data.totalElements === 1 ? "painting" : "paintings"}
            {title && <> matching “{title}”</>}
          </p>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {state.data.content.map((painting) => (
              <li key={painting.id} className="flex">
                <div className="w-full">
                  <PaintingCard painting={painting} />
                </div>
              </li>
            ))}
          </ul>
          {state.data.totalPages > 1 && (
            <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-4">
              <Button variant="outline" disabled={pageNumber <= 1} onClick={() => goToPage(pageNumber - 1)}>
                <ChevronLeft aria-hidden="true" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground" aria-live="polite">
                Page {state.data.page + 1} of {state.data.totalPages}
              </span>
              <Button variant="outline" disabled={pageNumber >= state.data.totalPages} onClick={() => goToPage(pageNumber + 1)}>
                Next
                <ChevronRight aria-hidden="true" />
              </Button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
