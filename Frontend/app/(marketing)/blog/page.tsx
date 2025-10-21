"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FadeIn, StaggerContainer } from "@/components/motion"
import { Calendar, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function BlogPage() {
  const posts = [
    {
      id: 1,
      title: "Getting Started with NovaPulse: A Complete Guide",
      excerpt: "Learn how to set up your NovaPulse account and start automating your workflows in minutes.",
      category: "Getting Started",
      author: "Sarah Chen",
      date: "2025-01-15",
      readTime: "5 min read",
      image: "/placeholder.svg?height=400&width=600",
    },
    {
      id: 2,
      title: "5 Automation Workflows That Save Hours Every Week",
      excerpt: "Discover the most effective automation patterns used by successful teams to streamline operations.",
      category: "Automation",
      author: "Marcus Johnson",
      date: "2025-01-12",
      readTime: "8 min read",
      image: "/placeholder.svg?height=400&width=600",
    },
    {
      id: 3,
      title: "Security Best Practices for SaaS Platforms",
      excerpt: "Everything you need to know about keeping your data secure in the cloud.",
      category: "Security",
      author: "Elena Rodriguez",
      date: "2025-01-10",
      readTime: "6 min read",
      image: "/placeholder.svg?height=400&width=600",
    },
    {
      id: 4,
      title: "Scaling Your Team: How NovaPulse Grows With You",
      excerpt: "From startup to enterprise, learn how NovaPulse adapts to your team's changing needs.",
      category: "Growth",
      author: "David Park",
      date: "2025-01-08",
      readTime: "7 min read",
      image: "/placeholder.svg?height=400&width=600",
    },
    {
      id: 5,
      title: "Advanced Analytics: Turning Data Into Insights",
      excerpt: "Master the analytics dashboard and unlock powerful insights about your business.",
      category: "Analytics",
      author: "Lisa Wang",
      date: "2025-01-05",
      readTime: "9 min read",
      image: "/placeholder.svg?height=400&width=600",
    },
    {
      id: 6,
      title: "API Integration Guide: Connect Everything",
      excerpt: "Learn how to integrate NovaPulse with your existing tools using our comprehensive API.",
      category: "Integration",
      author: "James Miller",
      date: "2025-01-02",
      readTime: "10 min read",
      image: "/placeholder.svg?height=400&width=600",
    },
  ]

  const categories = ["All", "Getting Started", "Automation", "Security", "Growth", "Analytics", "Integration"]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-balance text-4xl font-bold text-foreground sm:text-5xl">NovaPulse Blog</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Tips, guides, and insights to help you get the most out of NovaPulse.
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <section className="border-b border-border px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap gap-2">
            {categories.map((category, index) => (
              <Badge
                key={index}
                variant={category === "All" ? "default" : "outline"}
                className="cursor-pointer hover:border-nova-indigo transition-colors"
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <StaggerContainer className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <FadeIn key={post.id} delay={index * 0.05}>
                <Link href={`/blog/${post.id}`}>
                  <Card className="overflow-hidden hover:border-nova-indigo/50 transition-colors cursor-pointer h-full flex flex-col">
                    <div className="aspect-video overflow-hidden bg-muted">
                      <img
                        src={post.image || "/placeholder.svg"}
                        alt={post.title}
                        className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="flex flex-col flex-grow p-6">
                      <Badge className="w-fit bg-nova-indigo/10 text-nova-indigo hover:bg-nova-indigo/20">
                        {post.category}
                      </Badge>
                      <h3 className="mt-4 text-lg font-semibold text-foreground line-clamp-2">{post.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                      <div className="mt-auto pt-4 flex items-center justify-between border-t border-border">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(post.date).toLocaleDateString()}
                          </div>
                          <span>{post.readTime}</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-nova-indigo" />
                      </div>
                    </div>
                  </Card>
                </Link>
              </FadeIn>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </div>
  )
}
