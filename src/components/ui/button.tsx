import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        // 🟤 Add / Primary
        default:
          "bg-primary text-primary-foreground shadow hover:bg-[color-mix(in_oklab,var(--primary)_90%,black)]",

        // 🟠 Delete / Remove
        destructive:
          "bg-destructive text-white shadow hover:bg-[color-mix(in_oklab,var(--destructive)_90%,black)] focus-visible:ring-destructive/30",

        // 🟡 Warning / Pending
        warning:
          "bg-[#f1b24a] text-[#242424] shadow hover:bg-[#d99b3d] focus-visible:ring-[#f1b24a]/30",

        // 🟢 Success / Save / Confirm
        success:
          "bg-[#4caf50] text-white shadow hover:bg-[#449e47] focus-visible:ring-[#4caf50]/30",

        // 🟠 Edit / Update
        secondary:
          "bg-[#a37e67] text-white shadow hover:bg-[#8b6955] focus-visible:ring-[#a37e67]/30",

        // ⚪ Outline Button
        outline:
          "border border-primary text-primary bg-transparent hover:bg-primary/10",

        // 👻 Ghost Button
        ghost:
          "text-primary hover:bg-primary/10 hover:text-primary-foreground",

        // 🔗 Link Style
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
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
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
