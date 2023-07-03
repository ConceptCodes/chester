import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type Commands = "/breakdown" | "/next-move" | "/mind-reader" | "/opponent";

export type Ratings = "beginner" | "intermediate" | "advanced" | "expert";
