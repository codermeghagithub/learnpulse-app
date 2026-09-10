import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border-2 border-border text-sm font-medium whitespace-nowrap transition-all duration-100 outline-none select-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer shadow-[2px_2px_0px_var(--shadow-color)] hover:shadow-[3px_3px_0px_var(--shadow-color)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_var(--shadow-color)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/95",
        outline:
          "bg-card text-foreground hover:bg-muted/80",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-muted",
        ghost:
          "border-transparent shadow-none hover:border-border hover:bg-muted/60 hover:shadow-[2px_2px_0px_var(--shadow-color)] text-foreground",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link: "border-transparent shadow-none hover:shadow-none hover:translate-none text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 gap-2 px-4 text-sm rounded-md",
        xs: "h-7 gap-1 px-2.5 text-xs rounded-sm [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-3 text-xs rounded-md [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2.5 px-6 text-base rounded-md",
        icon: "size-9 p-0 rounded-md",
        "icon-xs": "size-7 p-0 rounded-sm [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 p-0 rounded-md",
        "icon-lg": "size-11 p-0 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  nativeButton,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  const isNonButtonRender =
    props.render !== undefined &&
    !(
      typeof props.render === "object" &&
      props.render !== null &&
      "type" in props.render &&
      props.render.type === "button"
    )

  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      nativeButton={nativeButton ?? (isNonButtonRender ? false : undefined)}
      {...props}
    />
  )
}

export { Button, buttonVariants }
