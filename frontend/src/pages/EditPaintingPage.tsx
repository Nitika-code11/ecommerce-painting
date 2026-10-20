import { useNavigate, useParams } from "react-router-dom";
import { getPainting, updatePainting } from "@/api/paintingsApi";
import { PaintingForm } from "@/components/PaintingForm";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { errorMessage, isNotFound, parseId } from "@/lib/errors";
import { useApi } from "@/lib/useApi";
import { toFormValues } from "@/validation/paintingValidation";
import { NotFoundPage } from "./NotFoundPage";

/** Route wrapper: validates the :id in the URL before doing any work. */
export function EditPaintingPage() {
  const id = parseId(useParams().id);
  if (id === null) return <NotFoundPage message="That painting doesn't exist." />;
  return <EditPainting id={id} />;
}

/** "Edit painting" screen (administrators only): loads the painting, then shows the form filled in. */
function EditPainting({ id }: { id: number }) {
  const navigate = useNavigate();
  const { state, retry } = useApi((signal) => getPainting(id, signal), [id]);

  if (state.status === "loading") return <LoadingState label="Loading painting…" />;
  if (state.status === "error") {
    if (isNotFound(state.error)) return <NotFoundPage message="That painting doesn't exist or has been removed." />;
    return <ErrorState title="Couldn't load this painting" message={errorMessage(state.error)} onRetry={retry} />;
  }

  return (
    <section aria-labelledby="edit-heading" className="mx-auto max-w-2xl">
      <h1 id="edit-heading" className="mb-6 text-3xl font-semibold">
        Edit “{state.data.title}”
      </h1>
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <PaintingForm
          initialValues={toFormValues(state.data)} // pre-fill with the current values
          submitLabel="Save changes"
          submittingLabel="Saving…"
          onCancel={() => navigate(`/paintings/${id}`)}
          onSubmit={async (input) => {
            const updated = await updatePainting(id, input);
            navigate(`/paintings/${id}`, { state: { notice: `“${updated.title}” was updated.` } });
          }}
        />
      </div>
    </section>
  );
}
