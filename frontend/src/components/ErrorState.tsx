import { AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = "Something went wrong", message, onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      <AlertTriangle aria-hidden="true" className="size-8 text-destructive" />
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
