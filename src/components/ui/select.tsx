import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

function Select({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <div className="relative w-full">
      <select
        data-slot="select"
        className={cn(
          "h-10 w-full appearance-none rounded-md border-2 border-border bg-input px-3.5 py-2 pr-9 text-sm font-normal text-foreground transition-all outline-none shadow-[2px_2px_0px_var(--shadow-color)] focus:shadow-[3px_3px_0px_var(--shadow-color)] focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground stroke-[2.5]" />
    </div>
  );
}

export { Select };
