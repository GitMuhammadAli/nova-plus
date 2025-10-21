"use client"

import { motion } from "framer-motion"
import { rotate } from "@/lib/animations"

export function LoadingSpinner() {
  return (
    <motion.div
      className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full"
      variants={rotate}
      animate="animate"
    />
  )
}
