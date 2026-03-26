"use client";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  hover?: boolean;
  glow?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function GlassCard({ className, children, hover = true, glow = false }: GlassCardProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div
      className={cn(
        "rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm",
        "transition-colors duration-300",
        hover && "hover:border-border hover:bg-card/90",
        glow && "hover:shadow-[0_0_20px_rgba(var(--primary-rgb,59,130,246)/0.06)]",
        className
      )}
      whileHover={hover && !prefersReducedMotion ? { y: -2 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {children}
    </motion.div>
  );
}
