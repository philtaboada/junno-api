"use client"

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer group/checkbox relative flex size-[1.125rem] shrink-0 items-center justify-center rounded-[6px] border-2 border-border/75 bg-background outline-none transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out",
        "after:absolute after:-inset-x-2.5 after:-inset-y-2",
        "hover:border-brand-coral/50 hover:bg-brand-coral-muted/35",
        "focus-visible:border-brand-indigo focus-visible:ring-3 focus-visible:ring-brand-indigo/25",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border/75 disabled:hover:bg-background",
        "active:scale-[0.92]",
        "data-checked:border-brand-coral data-checked:bg-brand-coral data-checked:text-brand-coral-foreground",
        "data-checked:shadow-[0_0_0_3px] data-checked:shadow-brand-coral-muted",
        "data-checked:hover:border-brand-coral data-checked:hover:bg-brand-coral",
        "data-checked:active:scale-100",
        "dark:border-border/80 dark:bg-card dark:hover:bg-brand-coral-muted/25",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className={cn(
          "grid place-content-center text-current",
          "transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          "data-starting-style:scale-50 data-starting-style:opacity-0",
          "data-ending-style:scale-50 data-ending-style:opacity-0"
        )}
      >
        <Check className="size-3 stroke-[3]" aria-hidden />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
