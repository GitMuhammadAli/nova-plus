"use client"

import { Button } from "@/components/ui/button"
import { FadeIn } from "@/components/motion"
import { Lock, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function Unauthorized() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <FadeIn>
        <div className="text-center">
          <div className="mb-8 flex justify-center">
            <Lock className="h-16 w-16 text-coral" />
          </div>
          <h2 className="text-3xl font-bold text-foreground">Access Denied</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            You don't have permission to access this resource. Please contact your administrator if you believe this is
            an error.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href="/dashboard">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline" className="bg-transparent">
                Account Settings
              </Button>
            </Link>
          </div>
        </div>
      </FadeIn>
    </div>
  )
}
