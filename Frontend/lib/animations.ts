"use client"

import type { Variants } from "framer-motion"

// ─── Fade animations ────────────────────────────────────────────────
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
}

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.2, 0, 0, 1] },
  },
}

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.2, 0, 0, 1] },
  },
}

// ─── Scale animations ───────────────────────────────────────────────
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2, ease: [0.2, 0, 0, 1] },
  },
}

export const scaleInCenter: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.25, ease: [0.2, 0, 0, 1] },
  },
}

// ─── Slide animations ───────────────────────────────────────────────
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.25, ease: [0.2, 0, 0, 1] },
  },
}

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.25, ease: [0.2, 0, 0, 1] },
  },
}

// ─── Stagger ────────────────────────────────────────────────────────
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.04,
    },
  },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: [0.2, 0, 0, 1] },
  },
}

// ─── Hover / Tap ────────────────────────────────────────────────────
export const hoverScale = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: { type: "spring" as const, stiffness: 500, damping: 35 },
}

export const hoverLift = {
  whileHover: { y: -2 },
  transition: { type: "spring" as const, stiffness: 500, damping: 30 },
}

// ─── Looping animations ────────────────────────────────────────────
export const pulse: Variants = {
  animate: {
    opacity: [1, 0.5, 1],
    transition: { duration: 2, repeat: Number.POSITIVE_INFINITY },
  },
}

export const bounce: Variants = {
  animate: {
    y: [0, -8, 0],
    transition: { duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
  },
}

export const rotate: Variants = {
  animate: {
    rotate: 360,
    transition: { duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
  },
}

// ─── Page transition ────────────────────────────────────────────────
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.2, 0, 0, 1] },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.15 },
  },
}

// ─── Shared Transitions ─────────────────────────────────────────────
export const springTransition = {
  type: "spring" as const,
  stiffness: 500,
  damping: 35,
}

export const smoothTransition = {
  duration: 0.2,
  ease: [0.2, 0, 0, 1],
}

// ─── Button interactions ────────────────────────────────────────────
export const buttonTap = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.97 },
  transition: { type: "spring" as const, stiffness: 600, damping: 30 },
}

// ─── Modal / Dialog ─────────────────────────────────────────────────
export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
}

export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 500, damping: 32 },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 4,
    transition: { duration: 0.15 },
  },
}

// ─── Toast slide-in ─────────────────────────────────────────────────
export const slideInFromRight: Variants = {
  hidden: { opacity: 0, x: 60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 500, damping: 30 },
  },
  exit: {
    opacity: 0,
    x: 60,
    transition: { duration: 0.15 },
  },
}

// ─── Progress bar fill ──────────────────────────────────────────────
export const progressFill = (width: number): Variants => ({
  hidden: { width: 0 },
  visible: {
    width: `${width}%`,
    transition: { duration: 0.6, ease: [0.2, 0, 0, 1] },
  },
})

// ─── Shake (validation error) ───────────────────────────────────────
export const shake: Variants = {
  shake: {
    x: [0, -4, 4, -2, 2, 0],
    transition: { duration: 0.3 },
  },
}

// ─── Tab indicator ──────────────────────────────────────────────────
export const tabIndicator = {
  layout: true,
  transition: { type: "spring" as const, stiffness: 500, damping: 35 },
}

// ─── Success checkmark ──────────────────────────────────────────────
export const successPulse: Variants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: [0, 1.1, 1],
    transition: { duration: 0.3, times: [0, 0.6, 1], ease: "easeOut" },
  },
}

// ─── Counter config ─────────────────────────────────────────────────
export const counterConfig = {
  duration: 0.8,
  ease: [0.2, 0, 0, 1] as number[],
}

// ─── Viewport config ────────────────────────────────────────────────
export const viewportConfig = {
  once: true,
  margin: "-60px" as const,
}
