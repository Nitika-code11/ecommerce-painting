import type { ReactNode } from "react";
import { Frame } from "lucide-react";

/** A friendly "nothing here" panel: an icon, a heading, and optional extra content such as a button. */
export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      {/* aria-hidden: the icon is decoration, so screen readers skip it. */}
      <Frame aria-hidden="true" className="size-8 text-muted-foreground" />
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </div>
  );
}
