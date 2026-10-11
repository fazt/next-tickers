import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Solo permite redirigir a rutas internas (evita open redirects). */
export function safeCallbackUrl(url: string | undefined, fallback = "/dashboard") {
  if (!url || !url.startsWith("/") || url.startsWith("//") || url.startsWith("/\\")) {
    return fallback;
  }
  return url;
}
