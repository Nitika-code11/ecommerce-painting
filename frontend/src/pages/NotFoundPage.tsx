import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function NotFoundPage({ message = "We couldn't find that page." }: { message?: string }) {
  return (
    <section aria-labelledby="not-found-heading" className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      <p className="font-serif text-5xl font-semibold text-primary">404</p>
      <h1 id="not-found-heading" className="text-2xl font-semibold">
        Not found
      </h1>
      <p className="text-muted-foreground">{message}</p>
      <Button asChild variant="outline">
        <Link to="/paintings">Browse the catalogue</Link>
      </Button>
    </section>
  );
}
