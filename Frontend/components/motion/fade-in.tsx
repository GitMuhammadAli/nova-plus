"use client"

import { motion } from "framer-motion"
import { fadeIn } from "@/lib/animations"
import type React from "react"

interface FadeInProps {
  children: React.ReactNode
  delay?: number
}

export function FadeIn({ children, delay = 0 }: FadeInProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeIn}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  )
}
