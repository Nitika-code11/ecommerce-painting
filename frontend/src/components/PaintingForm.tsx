import { useId, useRef, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { ApiError } from "@/api/http";
import type { PaintingInput } from "@/types/painting";
import {
  LIMITS,
  toPaintingInput,
  validatePaintingForm,
  type PaintingFormErrors,
  type PaintingFormValues,
} from "@/validation/paintingValidation";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

interface PaintingFormProps {
  /** Starting text for each field (empty for "add", the painting's values for "edit"). */
  initialValues: PaintingFormValues;
  /** Button text normally, and while the request is running. */
  submitLabel: string;
  submittingLabel: string;
  /** Called with the validated input. Should throw (e.g. an ApiError) if saving fails, so the form can show why. */
  onSubmit: (input: PaintingInput) => Promise<void>;
  onCancel: () => void;
}

// Field order on the page; used to focus the first invalid field.
const FIELD_ORDER: (keyof PaintingFormValues)[] = ["title", "artist", "price", "stock", "imageUrl", "description"];

/** Keeps only server-reported errors for fields this form actually has (ignores unknown field names). */
function pickFieldErrors(fieldErrors: Record<string, string> | undefined): PaintingFormErrors {
  const result: PaintingFormErrors = {};
  if (!fieldErrors) return result;
  for (const key of FIELD_ORDER) {
    if (fieldErrors[key]) result[key] = fieldErrors[key];
  }
  return result;
}

/**
 * The add/edit form. It owns the typed text, validates before sending, shows errors next to the right field
 * (from either the client rules or the server's 400 response), and prevents double submits.
 */
export function PaintingForm({ initialValues, submitLabel, submittingLabel, onSubmit, onCancel }: PaintingFormProps) {
  const [values, setValues] = useState(initialValues);           // what the user has typed
  const [errors, setErrors] = useState<PaintingFormErrors>({});  // per-field messages
  const [formError, setFormError] = useState<string | null>(null); // a message about the form as a whole
  const [submitting, setSubmitting] = useState(false);           // true while the request is running
  const formRef = useRef<HTMLFormElement>(null);
  const idPrefix = useId(); // unique per form instance, so label/input ids never clash

  /** Moves keyboard focus to the first field with an error, so keyboard and screen-reader users land on it. */
  const focusFirstError = (errs: PaintingFormErrors) => {
    const first = FIELD_ORDER.find((key) => errs[key]);
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  };

  /** Updates one field, and clears that field's error as soon as the user starts correcting it. */
  const handleChange = (field: keyof PaintingFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault(); // stop the browser's own full-page form submission
    if (submitting) return; // ignore a second click while the first request is running
    setFormError(null);

    // 1) Client-side validation for instant feedback; stop here if anything is wrong.
    const validationErrors = validatePaintingForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      focusFirstError(validationErrors);
      return;
    }

    // 2) Send it. On failure, show the server's field messages (if any) plus a general message.
    setSubmitting(true);
    try {
      await onSubmit(toPaintingInput(values));
    } catch (error) {
      const serverFieldErrors = error instanceof ApiError ? pickFieldErrors(error.fieldErrors) : {};
      setErrors(serverFieldErrors);
      focusFirstError(serverFieldErrors);
      setFormError(error instanceof ApiError ? error.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
    // On success the caller navigates away, so submitting is intentionally left true.
  };

  /** Props shared by every input: id, name, current value, disabled-while-saving, and accessibility links to its error. */
  const field = (name: keyof PaintingFormValues) => {
    const id = `${idPrefix}-${name}`;
    const errorId = `${id}-error`;
    return {
      id,
      name,
      value: values[name],
      disabled: submitting,
      "aria-invalid": errors[name] ? true : undefined,
      "aria-describedby": errors[name] ? errorId : undefined,
      onChange: (e: { target: { value: string } }) => handleChange(name, e.target.value),
    };
  };

  /** The red message under a field (with a screen-reader-only "Error:" prefix), or nothing if the field is valid. */
  const errorText = (name: keyof PaintingFormValues) =>
    errors[name] ? (
      <p id={`${idPrefix}-${name}-error`} className="text-sm text-destructive">
        <span className="sr-only">Error: </span>
        {errors[name]}
      </p>
    ) : null;

  return (
    // noValidate: we show our own, consistent messages instead of the browser's pop-ups.
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="grid gap-5" aria-busy={submitting}>
      {/* Form-level error (e.g. "Please sign in", "server problem"); role="alert" announces it. */}
      {formError && (
        <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {formError}
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-title`}>
          Title <span aria-hidden="true">*</span>
        </Label>
        <Input {...field("title")} required maxLength={LIMITS.title} autoComplete="off" />
        {errorText("title")}
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-artist`}>
          Artist <span aria-hidden="true">*</span>
        </Label>
        <Input {...field("artist")} required maxLength={LIMITS.artist} autoComplete="off" />
        {errorText("artist")}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}-price`}>
            Price (₹) <span aria-hidden="true">*</span>
          </Label>
          <Input {...field("price")} required inputMode="decimal" placeholder="0.00" />
          {errorText("price")}
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}-stock`}>
            Stock <span aria-hidden="true">*</span>
          </Label>
          <Input {...field("stock")} required inputMode="numeric" placeholder="0" />
          {errorText("stock")}
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-imageUrl`}>Image URL</Label>
        <Input {...field("imageUrl")} type="url" inputMode="url" placeholder="https://…" />
        {errorText("imageUrl")}
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-description`}>Description</Label>
        <Textarea {...field("description")} rows={5} maxLength={LIMITS.description} />
        {errorText("description")}
      </div>

      <p className="text-xs text-muted-foreground">
        <span aria-hidden="true">*</span> Required field
      </p>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 aria-hidden="true" className="animate-spin" />}
          {submitting ? submittingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}
