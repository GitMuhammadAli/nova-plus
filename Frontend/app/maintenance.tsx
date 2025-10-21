"use client"

import { Button } from "@/components/ui/button"
import { FadeIn } from "@/components/motion"
import { Wrench, Mail } from "lucide-react"
import Link from "next/link"

export default function Maintenance() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <FadeIn>
        <div className="text-center">
          <div className="mb-8 flex justify-center">
            <Wrench className="h-16 w-16 text-sapphire" />
          </div>
          <h2 className="text-3xl font-bold text-foreground">Maintenance in Progress</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            We're currently performing scheduled maintenance to improve your experience. We'll be back online shortly.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">Expected downtime: 2 hours</p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button disabled>
              <Wrench className="mr-2 h-4 w-4" />
              Check Status
            </Button>
            <Link href="mailto:support@novapulse.com">
              <Button variant="outline" className="bg-transparent">
                <Mail className="mr-2 h-4 w-4" />
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </FadeIn>
    </div>
  )
}
