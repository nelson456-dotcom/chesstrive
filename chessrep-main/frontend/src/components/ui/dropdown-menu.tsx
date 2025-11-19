import * as React from "react"
import { cn } from "../../lib/utils"
import { ChevronDown } from "lucide-react"

export interface DropdownMenuOption {
  label: string
  onClick: () => void
  Icon?: React.ReactNode
}

export interface DropdownMenuProps {
  options: DropdownMenuOption[]
  children: React.ReactNode
  className?: string
  align?: "start" | "end" | "center"
}

const DropdownMenu = React.forwardRef<HTMLDivElement, DropdownMenuProps>(
  ({ options, children, className, align = "end", ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const dropdownRef = React.useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false)
        }
      }

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside)
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }, [isOpen])

    const alignClasses = {
      start: "left-0",
      end: "right-0",
      center: "left-1/2 -translate-x-1/2",
    }

    return (
      <div
        ref={dropdownRef}
        className={cn("relative inline-block", className)}
        {...props}
      >
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center justify-center gap-1 rounded-md p-1 text-sm font-medium transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:pointer-events-none disabled:opacity-50"
        >
          {children}
          {typeof children === 'string' && (
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                isOpen && "rotate-180"
              )}
            />
          )}
        </button>

        {isOpen && (
          <div
            className={cn(
              "absolute z-50 mt-2 min-w-[8rem] overflow-hidden rounded-md border border-slate-700 bg-slate-800 p-1 text-white shadow-lg",
              alignClasses[align]
            )}
          >
            <div className="space-y-1">
              {options.map((option, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    option.onClick()
                    setIsOpen(false)
                  }}
                  className="relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-slate-700 focus:bg-slate-700 text-gray-200 hover:text-white disabled:pointer-events-none disabled:opacity-50"
                >
                  {option.Icon && (
                    <span className="flex-shrink-0">{option.Icon}</span>
                  )}
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }
)

DropdownMenu.displayName = "DropdownMenu"

export { DropdownMenu }

