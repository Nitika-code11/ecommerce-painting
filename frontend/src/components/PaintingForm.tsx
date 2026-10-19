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
  initialValues: PaintingFormValues;
  submitLabel: string;
  submittingLabel: string;
  onSubmit: (input: PaintingInput) => Promise<void>;
  onCancel: () => void;
}

const FIELD_ORDER: (keyof PaintingFormValues)[] = ["title", "artist", "price", "stock", "imageUrl", "description"];

function pickFieldErrors(fieldErrors: Record<string, string> | undefined): PaintingFormErrors {
  const result: PaintingFormErrors = {};
  if (!fieldErrors) return result;
  for (const key of FIELD_ORDER) {
    if (fieldErrors[key]) result[key] = fieldErrors[key];
  }
  return result;
}

export function PaintingForm({ initialValues, submitLabel, submittingLabel, onSubmit, onCancel }: PaintingFormProps) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<PaintingFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const idPrefix = useId();

  const focusFirstError = (errs: PaintingFormErrors) => {
    const first = FIELD_ORDER.find((key) => errs[key]);
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  };

  const handleChange = (field: keyof PaintingFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setFormError(null);

    const validationErrors = validatePaintingForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      focusFirstError(validationErrors);
      return;
    }

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
  };

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

  const errorText = (name: keyof PaintingFormValues) =>
    errors[name] ? (
      <p id={`${idPrefix}-${name}-error`} className="text-sm text-destructive">
        <span className="sr-only">Error: </span>
        {errors[name]}
      </p>
    ) : null;

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="grid gap-5" aria-busy={submitting}>
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
