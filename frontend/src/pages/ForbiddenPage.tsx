import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

/** Shown when a signed-in user without the ADMIN role opens a management page. */
export function ForbiddenPage() {
  return (
    <section aria-labelledby="forbidden-heading" className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      <p className="font-serif text-5xl font-semibold text-primary">403</p>
      <h1 id="forbidden-heading" className="text-2xl font-semibold">
        Not allowed
      </h1>
      <p className="text-muted-foreground">Only administrators can manage paintings.</p>
      <Button asChild variant="outline">
        <Link to="/paintings">Browse the catalogue</Link>
      </Button>
    </section>
  );
}
