import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        'relative bg-accent animate-pulse rounded-md overflow-hidden',
        'after:absolute after:inset-0 after:-translate-x-full',
        'after:bg-linear-to-r after:from-transparent after:via-background/20 after:to-transparent',
        'after:animate-[shimmer_2s_infinite]',
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
