import { cn } from "@/lib/utils"

/**
 * Lightweight text hover shimmer effect (Aceternity-inspired).
 * - Default: normal text
 * - Hover: gradient "shimmer" overlay
 */
export function TextHoverEffect({ text, className }) {
  return (
    <span className={cn("relative inline-block", className)}>
      <style>{`
        @keyframes text-hover-shimmer {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
      <span className="relative z-[1]">{text}</span>
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 z-[2] opacity-0 transition-opacity duration-200",
          "group-hover:opacity-100"
        )}
        style={{
          WebkitTextFillColor: "transparent",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          backgroundImage:
            "linear-gradient(90deg, rgba(34,211,238,.15), rgba(34,211,238,.95), rgba(167,139,250,.95), rgba(34,211,238,.15))",
          backgroundSize: "200% 100%",
          animation: "text-hover-shimmer 1.2s linear infinite",
          filter: "drop-shadow(0 0 10px rgba(34,211,238,.25))",
        }}
      >
        {text}
      </span>
    </span>
  )
}

