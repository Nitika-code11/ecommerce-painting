import { useState, type MouseEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Pencil, Trash2 } from "lucide-react";
import { deletePainting, getPainting } from "@/api/paintingsApi";
import { PaintingImage } from "@/components/PaintingImage";
import { StockBadge } from "@/components/StockBadge";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useCanManage } from "@/lib/auth";
import { errorMessage, isNotFound, parseId } from "@/lib/errors";
import { formatPrice } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import type { Painting } from "@/types/painting";
import { NotFoundPage } from "./NotFoundPage";

/** Route wrapper: validates the :id in the URL (e.g. /paintings/abc is a 404) before loading anything. */
export function PaintingDetailsPage() {
  const id = parseId(useParams().id);
  if (id === null) return <NotFoundPage message="That painting doesn't exist." />;
  return <PaintingDetails id={id} />;
}

/** Full page for one painting: big image, details, and (for administrators only) edit and delete actions. */
function PaintingDetails({ id }: { id: number }) {
  const canManage = useCanManage();
  const { state, retry } = useApi((signal) => getPainting(id, signal), [id]);

  if (state.status === "loading") return <LoadingState label="Loading painting…" />;
  if (state.status === "error") {
    // A 404 from the server gets the friendly "not found" page; other errors get a retryable error message.
    if (isNotFound(state.error)) return <NotFoundPage message="That painting doesn't exist or has been removed." />;
    return <ErrorState title="Couldn't load this painting" message={errorMessage(state.error)} onRetry={retry} />;
  }

  const painting = state.data;
  return (
    <article>
      <Link
        to="/paintings"
        className="mb-6 inline-flex items-center gap-1 rounded-md text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to catalogue
      </Link>
      <div className="grid gap-8 md:grid-cols-2">
        <PaintingImage src={painting.imageUrl} alt={painting.title} className="aspect-[4/3] rounded-lg border md:aspect-square" />
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-semibold sm:text-4xl">{painting.title}</h1>
            <p className="mt-1 text-lg text-muted-foreground">by {painting.artist}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-2xl font-semibold">{formatPrice(painting.price)}</span>
            <StockBadge stock={painting.stock} />
          </div>
          <section aria-labelledby="description-heading" className="border-t pt-4">
            <h2 id="description-heading" className="mb-2 text-lg font-semibold">
              About this painting
            </h2>
            {painting.description ? (
              <p className="whitespace-pre-line leading-relaxed">{painting.description}</p>
            ) : (
              <p className="text-muted-foreground">No description provided.</p>
            )}
          </section>
          {canManage && <AdminActions painting={painting} />}
        </div>
      </div>
    </article>
  );
}

/** Edit link and a Delete button that asks for confirmation first. Only rendered for administrators. */
function AdminActions({ painting }: { painting: Painting }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);       // is the confirmation dialog open?
  const [deleting, setDeleting] = useState(false); // is the delete request running?
  const [error, setError] = useState<string | null>(null);

  /** Runs when the user confirms. The dialog stays open until the request finishes, so errors can be shown in it. */
  const handleDelete = async (event: MouseEvent) => {
    event.preventDefault(); // keep the dialog open until the request finishes
    if (deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await deletePainting(painting.id);
      navigate("/paintings", { state: { notice: `“${painting.title}” was deleted.` } });
    } catch (err) {
      // Already gone counts as success from the user's point of view.
      if (isNotFound(err)) {
        navigate("/paintings", { state: { notice: `“${painting.title}” was already removed.` } });
        return;
      }
      setError(errorMessage(err));
      setDeleting(false);
    }
  };

  return (
    <div className="mt-2 flex flex-wrap gap-2 border-t pt-4">
      <Button asChild variant="outline">
        <Link to={`/paintings/${painting.id}/edit`}>
          <Pencil aria-hidden="true" />
          Edit
        </Link>
      </Button>
      <AlertDialog open={open} onOpenChange={(next) => !deleting && (setOpen(next), setError(null))}>
        <AlertDialogTrigger asChild>
          <Button variant="outline" className="text-destructive hover:text-destructive">
            <Trash2 aria-hidden="true" />
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{painting.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the painting from the catalogue. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 aria-hidden="true" className="animate-spin" />}
              {deleting ? "Deleting…" : "Delete painting"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
