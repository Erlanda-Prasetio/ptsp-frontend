import { cn } from "@/lib/utils"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Inter } from "next/font/google"
import "./globals.css"
import type { ReactNode } from "react"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "PTSP Jawa Tengah Chatbot",
  description: "Chatbot untuk informasi Pelayanan Terpadu Satu Pintu dan data Pemerintah Jawa Tengah.",
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("flex min-h-svh flex-col antialiased", inter.className)}>
        <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
      </body>
    </html>
  )
}
