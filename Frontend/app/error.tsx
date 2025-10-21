"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { FadeIn } from "@/components/motion"
import { AlertCircle, RotateCcw } from "lucide-react"
import { useEffect } from "react"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <FadeIn>
        <div className="text-center">
          <div className="mb-8 flex justify-center">
            <AlertCircle className="h-16 w-16 text-coral" />
          </div>
          <h2 className="text-3xl font-bold text-foreground">Something Went Wrong</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            An unexpected error occurred. Our team has been notified and is working on a fix.
          </p>
          <p className="mt-2 text-sm text-muted-foreground font-mono">{error.message}</p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button onClick={() => reset()}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Link href="/">
              <Button variant="outline" className="bg-transparent">
                Go Home
              </Button>
            </Link>
          </div>
        </div>
      </FadeIn>
    </div>
  )
}
