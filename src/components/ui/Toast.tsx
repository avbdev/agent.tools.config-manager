"use client"

import * as RadixToast from "@radix-ui/react-toast"
import { createContext, useContext, useState, useCallback, ReactNode } from "react"

// ─── Context ─────────────────────────────────────────────────────────────────

interface ToastMessage {
  id: string
  title: string
  description?: string
  variant?: "default" | "success" | "error"
}

interface ToastContextValue {
  toast: (msg: Omit<ToastMessage, "id">) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>")
  return ctx
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([])

  const toast = useCallback((msg: Omit<ToastMessage, "id">) => {
    setMessages((prev) => [...prev, { ...msg, id: crypto.randomUUID() }])
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      <RadixToast.Provider swipeDirection="right">
        {children}
        {messages.map((m) => (
          <RadixToast.Root
            key={m.id}
            className={[
              "flex items-start gap-3 rounded-lg border p-4 shadow-md",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[swipe=end]:animate-out data-[state=closed]:fade-out-80",
              "data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full",
              m.variant === "error"
                ? "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
                : m.variant === "success"
                  ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                  : "bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-700",
            ].join(" ")}
            onOpenChange={(open) => {
              if (!open) setMessages((prev) => prev.filter((x) => x.id !== m.id))
            }}
          >
            <div className="flex-1">
              <RadixToast.Title className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {m.title}
              </RadixToast.Title>
              {m.description && (
                <RadixToast.Description className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {m.description}
                </RadixToast.Description>
              )}
            </div>
            <RadixToast.Close className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-sm">
              ✕
            </RadixToast.Close>
          </RadixToast.Root>
        ))}
        <RadixToast.Viewport className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-[360px] max-w-[100vw]" />
      </RadixToast.Provider>
    </ToastContext.Provider>
  )
}
