"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Volume2 } from "lucide-react"

const navigationItems = [
  { href: "/", label: "Upload Chart", step: 1 },
  { href: "/analyze", label: "Audio Analysis", step: 2 },
  { href: "/insights", label: "AI Insights", step: 3 },
]

export function Header() {
  const pathname = usePathname()

  return (
    <header className="border-b border-border bg-card" role="banner">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg"
            aria-label="ChartSpeak home"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary" aria-hidden="true">
              <Volume2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">ChartSpeak</h1>
              <p className="text-sm text-muted-foreground">Data Through Sound</p>
            </div>
          </Link>

          <nav aria-label="Main navigation" role="navigation">
            <ol className="flex items-center gap-2" role="list" aria-label="Application steps">
              {navigationItems.map((item, index) => {
                const isCurrentPage = pathname === item.href
                const isCompleted = navigationItems.findIndex(n => n.href === pathname) > index

                return (
                  <li key={item.href} className="flex items-center">
                    {index > 0 && (
                      <div 
                        className={cn(
                          "mx-2 h-0.5 w-4 sm:w-8",
                          isCompleted ? "bg-primary" : "bg-border"
                        )} 
                        aria-hidden="true" 
                      />
                    )}
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors min-h-[44px]",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        isCurrentPage
                          ? "bg-primary text-primary-foreground"
                          : isCompleted
                          ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                          : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                      )}
                      aria-current={isCurrentPage ? "step" : undefined}
                      aria-label={`Step ${item.step}: ${item.label}${isCurrentPage ? " (current)" : ""}`}
                    >
                      <span
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                          isCurrentPage
                            ? "bg-primary-foreground text-primary"
                            : isCompleted
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                        aria-hidden="true"
                      >
                        {item.step}
                      </span>
                      <span className="hidden sm:inline">{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ol>
          </nav>
        </div>
      </div>
    </header>
  )
}
