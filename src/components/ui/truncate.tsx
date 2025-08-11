import * as React from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface TruncateProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: 1 | 2 | 3 | 4;
  children: React.ReactNode;
}

// A small utility to map number of lines to Tailwind classes
const lineClampClass = (lines: number) => {
  switch (lines) {
    case 1:
      return "line-clamp-1";
    case 2:
      return "line-clamp-2";
    case 3:
      return "line-clamp-3";
    case 4:
      return "line-clamp-4";
    default:
      return "line-clamp-1";
  }
};

export const Truncate = React.forwardRef<HTMLDivElement, TruncateProps>(
  ({ lines = 1, className, children, ...props }, ref) => {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            ref={ref}
            className={cn(
              "min-w-0 break-words", // allow breaking long words/URLs
              lineClampClass(lines),
              className
            )}
            {...props}
          >
            {children}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="max-w-sm break-words">
            {children}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }
);

Truncate.displayName = "Truncate";

export default Truncate;
