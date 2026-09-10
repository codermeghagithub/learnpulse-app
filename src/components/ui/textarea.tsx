import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-24 w-full rounded-md border-2 border-border bg-input px-3.5 py-2.5 text-base sm:text-sm font-medium text-foreground placeholder:text-muted-foreground/70 transition-all outline-none shadow-[2px_2px_0px_var(--shadow-color)] focus:shadow-[3px_3px_0px_var(--shadow-color)] focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
