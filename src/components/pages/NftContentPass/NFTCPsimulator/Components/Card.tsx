import * as React from "react"

// Importing the class variance authority for dynamic class generation
// Importing our custom cn utility for merging Tailwind classes
import { cn } from "./utils"

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

// Base Card component - Container for card content
export const Card: React.FC<CardProps> = ({ children, className }) => (
  <div
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
  >
    {children}
  </div>
)

// Card Header - Contains title and description area
export const CardHeader: React.FC<CardProps> = ({ children, className }) => (
  <div
    className={cn("flex flex-col space-y-1.5 p-6", className)}
  >
    {children}
  </div>
)

// Card Title - Main heading of the card
export const CardTitle: React.FC<CardProps> = ({ children, className }) => (
  <h3
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
  >
    {children}
  </h3>
)

// Card Description - Secondary text below the title
export const CardDescription: React.FC<CardProps> = ({ children, className }) => (
  <p
    className={cn("text-sm text-muted-foreground", className)}
  >
    {children}
  </p>
)

// Card Content - Main content area of the card
export const CardContent: React.FC<CardProps> = ({ children, className }) => (
  <div className={cn("p-6 pt-0", className)}>
    {children}
  </div>
)

// Card Footer - Bottom section of the card
export const CardFooter: React.FC<CardProps> = ({ children, className }) => (
  <div
    className={cn("flex items-center p-6 pt-0", className)}
  >
    {children}
  </div>
)