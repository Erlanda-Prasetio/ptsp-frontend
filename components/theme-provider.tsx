"use client"

import * as React from "react"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background text-foreground">{children}</div>
}
