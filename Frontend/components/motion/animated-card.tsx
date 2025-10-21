"use client"

import { motion } from "framer-motion"
import { fadeInUp, hoverLift } from "@/lib/animations"
import { Card } from "@/components/ui/card"
import type React from "react"

interface AnimatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  delay?: number
}

export function AnimatedCard({ delay = 0, children, ...props }: AnimatedCardProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={fadeInUp}
      transition={{ delay }}
      whileHover={hoverLift.whileHover}
    >
      <Card {...props}>{children}</Card>
    </motion.div>
  )
}
