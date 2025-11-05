"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AnimatedCard } from "@/components/motion/animated-card"
import { Badge } from "@/components/ui/badge"
import { Moon, Sun, Palette } from "lucide-react"

export default function ThemePage() {
  const { theme, setTheme } = useTheme()
  const [accentColor, setAccentColor] = useState("#6366F1")

  const themes = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "system", label: "System", icon: Palette },
  ]

  const accentOptions = [
    { name: "Nova Indigo", value: "#6366F1" },
    { name: "Mint", value: "#27C499" },
    { name: "Coral", value: "#EF4444" },
    { name: "Sapphire", value: "#3B82F6" },
    { name: "Amber", value: "#F59E0B" },
    { name: "Rose", value: "#EC4899" },
  ]

  return (
      <div className="space-y-8 max-w-4xl">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-foreground">Theme Settings</h2>
          <p className="text-muted-foreground mt-1">Customize your interface appearance</p>
        </div>

        {/* Theme Selection */}
        <AnimatedCard delay={0.1}>
          <CardHeader>
            <CardTitle>Color Theme</CardTitle>
            <CardDescription>Choose your preferred color theme</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {themes.map((t) => {
                const Icon = t.icon
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      theme === t.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Icon className="w-6 h-6 mx-auto mb-2 text-foreground" />
                    <p className="text-sm font-medium text-foreground">{t.label}</p>
                    {theme === t.id && <Badge className="mt-2 w-full justify-center">Active</Badge>}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </AnimatedCard>

        {/* Accent Color Selection */}
        <AnimatedCard delay={0.2}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Accent Color
            </CardTitle>
            <CardDescription>Choose your accent color for interactive elements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {accentOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setAccentColor(option.value)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    accentColor === option.value ? "border-primary" : "border-border hover:border-primary/50"
                  }`}
                >
                  <div
                    className="w-full h-12 rounded-lg mb-2 border border-border"
                    style={{ backgroundColor: option.value }}
                  ></div>
                  <p className="text-sm font-medium text-foreground">{option.name}</p>
                  {accentColor === option.value && <Badge className="mt-2 w-full justify-center">Selected</Badge>}
                </button>
              ))}
            </div>
            <Button>Apply Accent Color</Button>
          </CardContent>
        </AnimatedCard>

        {/* Advanced Theme Settings */}
        <AnimatedCard delay={0.3}>
          <CardHeader>
            <CardTitle>Advanced Settings</CardTitle>
            <CardDescription>Fine-tune your theme preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                title: "Reduce Motion",
                description: "Minimize animations and transitions",
                enabled: false,
              },
              {
                title: "High Contrast",
                description: "Increase contrast for better readability",
                enabled: false,
              },
              {
                title: "Compact Mode",
                description: "Use compact spacing and smaller text",
                enabled: false,
              },
              {
                title: "Auto Theme Switch",
                description: "Automatically switch theme based on time of day",
                enabled: true,
              },
            ].map((setting, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <p className="font-medium text-foreground">{setting.title}</p>
                  <p className="text-sm text-muted-foreground">{setting.description}</p>
                </div>
                <input
                  type="checkbox"
                  checked={setting.enabled}
                  className="w-5 h-5 rounded border-border cursor-pointer"
                />
              </div>
            ))}
          </CardContent>
        </AnimatedCard>
      </div>
  )
}
