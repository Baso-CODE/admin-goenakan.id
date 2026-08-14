import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const buttonVariants = cva(
  // Menambahkan transisi yang lebih halus dan shadow default
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        // 🟤 Add / Primary - Efek kaca utama (berbasis warna primary)
        default:
          "bg-primary/80 backdrop-blur-md text-primary-foreground border border-white/20 shadow-lg hover:bg-primary/90 hover:shadow-xl hover:-translate-y-0.5",

        // 🟠 Delete / Remove - Efek kaca merah
        destructive:
          "bg-destructive/80 backdrop-blur-md text-white border border-red-200/30 shadow-md hover:bg-destructive/90 hover:shadow-lg hover:-translate-y-0.5 focus-visible:ring-destructive/30",

        // 🟡 Warning / Pending - Efek kaca kuning/oranye
        warning:
          "bg-[#f1b24a]/80 backdrop-blur-md text-[#242424] border border-white/40 shadow-md hover:bg-[#d99b3d]/90 hover:shadow-lg hover:-translate-y-0.5 focus-visible:ring-[#f1b24a]/30",

        // 🟢 Success / Save / Confirm - Efek kaca hijau
        success:
          "bg-[#4caf50]/80 backdrop-blur-md text-white border border-green-200/30 shadow-md hover:bg-[#449e47]/90 hover:shadow-lg hover:-translate-y-0.5 focus-visible:ring-[#4caf50]/30",

        // 🟠 Edit / Update - Efek kaca sekunder
        secondary:
          "bg-[#a37e67]/80 backdrop-blur-md text-white border border-white/20 shadow-md hover:bg-[#8b6955]/90 hover:shadow-lg hover:-translate-y-0.5 focus-visible:ring-[#a37e67]/30",

        // ⚪ Outline Button - Kaca putih transparan dengan border tegas
        outline:
          "bg-white/30 backdrop-blur-md border border-white/60 text-slate-700 shadow-sm hover:bg-white/50 hover:shadow-md hover:-translate-y-0.5",

        // 👻 Ghost Button - Kaca sangat tipis saat dihover
        ghost:
          "text-slate-600 hover:bg-white/40 hover:backdrop-blur-md hover:text-slate-900 hover:shadow-sm",

        // 🔗 Link Style - Tetap standar, biasanya tidak pakai kaca
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // Mengubah default rounded-md menjadi rounded-lg atau rounded-xl untuk kesan lebih cair (liquid)
        default: "h-10 px-5 py-2 has-[>svg]:px-4 rounded-xl",
        sm: "h-8 px-3 gap-1.5 has-[>svg]:px-2.5 rounded-lg",
        lg: "h-12 px-8 has-[>svg]:px-5 rounded-2xl",
        icon: "size-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
