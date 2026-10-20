import { useNavigate } from "react-router-dom";
import { createPainting } from "@/api/paintingsApi";
import { PaintingForm } from "@/components/PaintingForm";
import { toFormValues } from "@/validation/paintingValidation";

export function CreatePaintingPage() {
  const navigate = useNavigate();
  return (
    <section aria-labelledby="create-heading" className="mx-auto max-w-2xl">
      <h1 id="create-heading" className="mb-6 text-3xl font-semibold">
        Add a painting
      </h1>
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <PaintingForm
          initialValues={toFormValues()}
          submitLabel="Add painting"
          submittingLabel="Adding…"
          onCancel={() => navigate("/paintings")}
          onSubmit={async (input) => {
            const created = await createPainting(input);
            navigate(`/paintings/${created.id}`, { state: { notice: `“${created.title}” was added.` } });
          }}
        />
      </div>
    </section>
  );
}
