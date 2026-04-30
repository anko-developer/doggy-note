import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-[52px] w-full min-w-0 rounded-[8px] border border-[#d9d9d9] bg-white px-4 text-[15px] text-[#222222] transition-colors outline-none",
        "placeholder:text-[#8e8e8e] placeholder:font-normal",
        "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-[#f5f5f5] disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
