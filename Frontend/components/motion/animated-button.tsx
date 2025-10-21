"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { hoverScale } from "@/lib/animations"
import type React from "react"

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

export function AnimatedButton({ children, ...props }: AnimatedButtonProps) {
  return (
    <motion.div whileHover={hoverScale.whileHover} whileTap={hoverScale.whileTap}>
      <Button {...props}>{children}</Button>
    </motion.div>
  )
}
