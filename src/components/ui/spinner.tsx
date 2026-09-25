import { cn } from "cn"
import { IconLoadingCircle } from "@central-icons-react/round-outlined-radius-3-stroke-1.5"

function Spinner({ className, ...props }: React.ComponentProps<typeof IconLoadingCircle>) {
  return (
    // Central icons are aria-hidden by default; the spinner must stay announced
    <IconLoadingCircle data-slot="spinner" role="status" aria-label="Loading" ariaHidden={false} className={cn("size-4 animate-spin", className)} {...props} />
  )
}

export { Spinner }
