import * as React from "react"

import { cn } from "./utils"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  type?: string;
}

// Input component with support for various states and styles
const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  // Base styles for the input component
  const baseStyles = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
  
  // Interactive state styles
  const interactiveStyles = "ring-offset-background"
  
  // Focus styles
  const focusStyles = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
  
  // Disabled state styles
  const disabledStyles = "disabled:cursor-not-allowed disabled:opacity-50"
  
  // File input specific styles
  const fileStyles = "file:border-0 file:bg-transparent file:text-sm file:font-medium"
  
  return (
    <input
      type={type}
      className={cn(
        baseStyles,
        interactiveStyles,
        focusStyles,
        disabledStyles,
        type === "file" && fileStyles,
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }