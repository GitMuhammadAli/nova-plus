'use client'

import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { motion, useReducedMotion } from 'framer-motion'

import { cn } from '@/lib/utils'

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        'bg-primary/20 relative h-2 w-full overflow-hidden rounded-full',
        className,
      )}
      {...props}
    >
      <motion.div
        data-slot="progress-indicator"
        className="bg-gradient-to-r from-primary via-primary/80 to-primary h-full rounded-full relative overflow-hidden"
        initial={{ width: 0 }}
        animate={{ width: `${value || 0}%` }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
        }
      >
        {!shouldReduceMotion && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
        )}
      </motion.div>
    </ProgressPrimitive.Root>
  )
}

export { Progress }
