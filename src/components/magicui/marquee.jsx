import React from "react"
import { cn } from "@/lib/utils"
import "./marquee.css"

export function Marquee({
  children,
  className,
  reverse = false,
  pauseOnHover = false,
  vertical = false,
}) {
  return (
    <div
      className={cn(
        "magicui-marquee",
        vertical && "magicui-marquee-vertical",
        reverse && "magicui-marquee-reverse",
        pauseOnHover && "magicui-marquee-pause-hover",
        className,
      )}
    >
      <div className="magicui-marquee__inner">
        {children}
        {children}
      </div>
    </div>
  )
}

