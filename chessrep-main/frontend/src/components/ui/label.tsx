import * as React from "react"
import { cn } from "../../lib/utils"

const labelVariants = (className?: string) => {
  return cn(
    "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
    className
  )
}

const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={labelVariants(className)}
    {...props}
  />
))
Label.displayName = "Label"

export { Label }