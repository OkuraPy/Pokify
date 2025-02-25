"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number
}

export function Loading({ size = 24, className, ...props }: LoadingProps) {
  return (
    <div
      className={cn("flex items-center justify-center", className)}
      {...props}
    >
      <Loader2 
        className="animate-spin text-muted-foreground" 
        size={size}
      />
    </div>
  )
}
