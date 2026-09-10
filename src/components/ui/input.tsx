import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "min-h-11 sm:min-h-10 h-11 sm:h-10 w-full min-w-0 rounded-md border-2 border-border bg-input px-3.5 py-2 text-base sm:text-sm text-foreground placeholder:text-muted-foreground/70 transition-all outline-none shadow-[2px_2px_0px_var(--shadow-color)] focus:shadow-[3px_3px_0px_var(--shadow-color)] focus-visible:border-primary focus-visible:ring-0 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
