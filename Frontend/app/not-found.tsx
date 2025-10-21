"use client"

import { Button } from "@/components/ui/button"
import { FadeIn } from "@/components/motion"
import { ArrowLeft, Home } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <FadeIn>
        <div className="text-center">
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-nova-indigo">404</h1>
          </div>
          <h2 className="text-3xl font-bold text-foreground">Page Not Found</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href="/">
              <Button>
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="bg-transparent">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </Link>
          </div>
        </div>
      </FadeIn>
    </div>
  )
}
