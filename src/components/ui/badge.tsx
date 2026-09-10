import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1.5 rounded-xs border-1.5 border-border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-all shadow-[1px_1px_0px_var(--shadow-color)] [&>svg]:pointer-events-none [&>svg]:size-3.5",
  {
    variants: {
      variant: {
        default:
          "bg-[#151313] text-white dark:bg-[#F7F7F5] dark:text-[#151313]",
        primary:
          "bg-primary text-primary-foreground",
        secondary:
          "bg-secondary text-secondary-foreground",
        purple:
          "bg-[#BE94F5] text-[#151313] dark:bg-[#4D366B] dark:text-[#F7F7F5]",
        yellow:
          "bg-[#FCCC42] text-[#151313] dark:bg-[#614B14] dark:text-[#F7F7F5]",
        blue:
          "bg-[#C0E6FF] text-[#151313] dark:bg-[#234559] dark:text-[#F7F7F5]",
        destructive:
          "bg-destructive text-destructive-foreground",
        warning:
          "bg-[#FCCC42] text-[#151313] dark:bg-[#614B14] dark:text-[#F7F7F5]",
        success:
          "bg-green-500 text-[#151313] dark:text-white",
        outline:
          "bg-card text-foreground",
        ghost:
          "border-transparent shadow-none bg-transparent hover:bg-muted text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
