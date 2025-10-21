"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FadeIn } from "@/components/motion"
import { Calendar, User, ArrowLeft, Share2 } from "lucide-react"
import Link from "next/link"

export default function BlogPostPage({ params }: { params: { id: string } }) {
  // Mock blog post data
  const post = {
    id: params.id,
    title: "Getting Started with NovaPulse: A Complete Guide",
    excerpt: "Learn how to set up your NovaPulse account and start automating your workflows in minutes.",
    category: "Getting Started",
    author: "Sarah Chen",
    date: "2025-01-15",
    readTime: "5 min read",
    image: "/placeholder.svg?height=600&width=1200",
    content: `
      <h2>Introduction</h2>
      <p>NovaPulse is a powerful platform designed to help teams streamline their operations and automate workflows. In this guide, we'll walk you through the setup process and show you how to get started in just a few minutes.</p>
      
      <h2>Step 1: Create Your Account</h2>
      <p>First, head to our sign-up page and create your account. You'll need to provide your email address and create a secure password. We recommend using a strong password with a mix of uppercase, lowercase, numbers, and special characters.</p>
      
      <h2>Step 2: Set Up Your Workspace</h2>
      <p>Once you've created your account, you'll be guided through the workspace setup process. This includes naming your workspace, selecting your industry, and choosing your team size. This information helps us customize your experience.</p>
      
      <h2>Step 3: Invite Your Team</h2>
      <p>Now it's time to invite your team members. You can add team members by their email address and assign them specific roles and permissions. NovaPulse supports multiple roles including Admin, Manager, and Member.</p>
      
      <h2>Step 4: Create Your First Automation</h2>
      <p>With your team set up, you're ready to create your first automation. Head to the Automation Builder and select a template that matches your workflow. You can customize triggers, conditions, and actions to fit your specific needs.</p>
      
      <h2>Conclusion</h2>
      <p>Congratulations! You've successfully set up NovaPulse and created your first automation. From here, you can explore more advanced features and continue building automations to streamline your operations.</p>
    `,
    relatedPosts: [
      {
        id: 2,
        title: "5 Automation Workflows That Save Hours Every Week",
        category: "Automation",
      },
      {
        id: 3,
        title: "Security Best Practices for SaaS Platforms",
        category: "Security",
      },
    ],
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <Link href="/blog">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </div>

      {/* Article */}
      <article className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <FadeIn>
            <Badge className="bg-nova-indigo/10 text-nova-indigo hover:bg-nova-indigo/20">{post.category}</Badge>
            <h1 className="mt-4 text-balance text-4xl font-bold text-foreground sm:text-5xl">{post.title}</h1>
            <div className="mt-6 flex flex-wrap items-center gap-4 border-b border-border pb-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {post.author}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {new Date(post.date).toLocaleDateString()}
              </div>
              <span>{post.readTime}</span>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="mt-8 aspect-video overflow-hidden rounded-lg bg-muted">
              <img src={post.image || "/placeholder.svg"} alt={post.title} className="h-full w-full object-cover" />
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="prose prose-invert mt-12 max-w-none text-foreground">
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
            </div>
          </FadeIn>

          {/* Share Section */}
          <FadeIn delay={0.3}>
            <div className="mt-12 border-t border-border pt-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">Share this article</h3>
                  <p className="text-sm text-muted-foreground">Help others discover this guide</p>
                </div>
                <Button variant="outline" size="sm">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
          </FadeIn>

          {/* Related Posts */}
          <FadeIn delay={0.4}>
            <div className="mt-12 border-t border-border pt-12">
              <h2 className="text-2xl font-bold text-foreground">Related Articles</h2>
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                {post.relatedPosts.map((relatedPost) => (
                  <Link key={relatedPost.id} href={`/blog/${relatedPost.id}`}>
                    <Card className="p-6 hover:border-nova-indigo/50 transition-colors cursor-pointer">
                      <Badge className="bg-nova-indigo/10 text-nova-indigo hover:bg-nova-indigo/20">
                        {relatedPost.category}
                      </Badge>
                      <h3 className="mt-4 font-semibold text-foreground hover:text-nova-indigo transition-colors">
                        {relatedPost.title}
                      </h3>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </article>
    </div>
  )
}
