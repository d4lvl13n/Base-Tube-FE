import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Utility function to merge Tailwind classes
// This function combines clsx for conditional class joining
// and tailwind-merge for handling Tailwind class conflicts
export function cn(...inputs: (string | undefined | null | boolean | { [key: string]: boolean })[]): string {
  return twMerge(clsx(inputs))
}