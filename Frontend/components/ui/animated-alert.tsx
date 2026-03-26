"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { motion, useReducedMotion } from "framer-motion"
import { AlertTriangle, CheckCircle2, Info, XCircle, X } from "lucide-react"

interface AnimatedAlertProps {
  type?: "success" | "error" | "warning" | "info"
  title?: string
  message?: string
  onClose?: () => void
  className?: string
}

const typeStyles = {
  success: "border-green-500/30 bg-green-500/5",
  error: "border-red-500/30 bg-red-500/5",
  warning: "border-yellow-500/30 bg-yellow-500/5",
  info: "border-blue-500/30 bg-blue-500/5",
}

const iconStyles = {
  success: "bg-green-500/10 text-green-500",
  error: "bg-red-500/10 text-red-500",
  warning: "bg-yellow-500/10 text-yellow-500",
  info: "bg-blue-500/10 text-blue-500",
}

const iconMap = { success: CheckCircle2, error: XCircle, warning: AlertTriangle, info: Info }

export function AnimatedAlert({ type = "info", title, message, onClose, className }: AnimatedAlertProps) {
  const prefersReducedMotion = useReducedMotion()
  const Icon = iconMap[type]
  return (
    <motion.div
      className={cn("relative w-full rounded-lg border p-4 pl-12 shadow-sm overflow-hidden", typeStyles[type], className)}
      role="alert"
      initial={prefersReducedMotion ? false : { opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <div className={cn("absolute left-0 top-0 h-full w-10 flex items-center justify-center", iconStyles[type])}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-grow">
        {title && <h5 className="font-medium text-foreground">{title}</h5>}
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </div>
      {onClose && (
        <button onClick={onClose} aria-label="Dismiss"
          className="absolute right-3 top-3 p-1 rounded-full text-muted-foreground/50 transition-colors hover:text-muted-foreground hover:bg-muted/50">
          <X className="h-4 w-4" />
        </button>
      )}
    </motion.div>
  )
}
