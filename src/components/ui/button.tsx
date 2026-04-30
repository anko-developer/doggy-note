import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/50 active:not-aria-[haspopup]:scale-[0.98] disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white font-bold rounded-[8px] disabled:bg-[#e0e0e0] disabled:text-[#8e8e8e]",
        outline:
          "border-[#d9d9d9] bg-white text-[#222222] font-bold rounded-[8px] hover:bg-[#f7f7f7]",
        secondary:
          "bg-[#f5f5f5] text-[#222222] font-bold rounded-[8px] hover:bg-[#eeeeee]",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-[8px]",
        ghost:
          "text-[#8e8e8e] hover:text-[#444444]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-[54px] gap-1.5 px-5 text-[16px]",
        sm: "h-[44px] gap-1 px-4 text-[15px] rounded-[8px]",
        xs: "h-[36px] gap-1 px-3 text-[13px] rounded-[8px]",
        lg: "h-[60px] gap-1.5 px-6 text-[18px]",
        icon: "size-[44px] rounded-[8px]",
        "icon-sm": "size-[36px] rounded-[8px]",
        "icon-xs": "size-[28px] rounded-[8px]",
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
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
