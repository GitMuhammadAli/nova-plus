"use client"

import type React from "react"

import { useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AnimatedCard } from "@/components/motion/animated-card"
import { Palette, Upload, Eye } from "lucide-react"

export default function BrandingPage() {
  const [brandData, setBrandData] = useState({
    workspaceName: "Acme Inc.",
    logo: null,
    favicon: null,
    primaryColor: "#6366F1",
    accentColor: "#27C499",
    secondaryColor: "#F59E0B",
  })

  const [previewTheme, setPreviewTheme] = useState("light")

  const handleColorChange = (colorKey: string, value: string) => {
    setBrandData((prev) => ({ ...prev, [colorKey]: value }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setBrandData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <AppLayout title="Workspace Branding">
      <div className="space-y-8 max-w-4xl">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-foreground">Workspace Branding</h2>
          <p className="text-muted-foreground mt-1">Customize your workspace appearance and brand identity</p>
        </div>

        {/* Workspace Name */}
        <AnimatedCard delay={0.1}>
          <CardHeader>
            <CardTitle>Workspace Information</CardTitle>
            <CardDescription>Basic workspace details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Workspace Name</label>
              <Input
                name="workspaceName"
                value={brandData.workspaceName}
                onChange={handleInputChange}
                className="mt-2"
              />
            </div>
            <Button>Save Workspace Name</Button>
          </CardContent>
        </AnimatedCard>

        {/* Logo & Favicon */}
        <AnimatedCard delay={0.2}>
          <CardHeader>
            <CardTitle>Logo & Favicon</CardTitle>
            <CardDescription>Upload your workspace logo and favicon</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Logo Upload */}
              <div>
                <label className="text-sm font-medium text-foreground block mb-3">Workspace Logo</label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Drag and drop or click to upload</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 2MB</p>
                </div>
              </div>

              {/* Favicon Upload */}
              <div>
                <label className="text-sm font-medium text-foreground block mb-3">Favicon</label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Drag and drop or click to upload</p>
                  <p className="text-xs text-muted-foreground mt-1">ICO, PNG up to 1MB</p>
                </div>
              </div>
            </div>
            <Button>Save Logo & Favicon</Button>
          </CardContent>
        </AnimatedCard>

        {/* Brand Colors */}
        <AnimatedCard delay={0.3}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Brand Colors
            </CardTitle>
            <CardDescription>Customize your brand color palette</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-6">
              {/* Primary Color */}
              <div>
                <label className="text-sm font-medium text-foreground block mb-3">Primary Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brandData.primaryColor}
                    onChange={(e) => handleColorChange("primaryColor", e.target.value)}
                    className="w-12 h-12 rounded-lg cursor-pointer border border-border"
                  />
                  <Input
                    value={brandData.primaryColor}
                    onChange={(e) => handleColorChange("primaryColor", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <label className="text-sm font-medium text-foreground block mb-3">Accent Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brandData.accentColor}
                    onChange={(e) => handleColorChange("accentColor", e.target.value)}
                    className="w-12 h-12 rounded-lg cursor-pointer border border-border"
                  />
                  <Input
                    value={brandData.accentColor}
                    onChange={(e) => handleColorChange("accentColor", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Secondary Color */}
              <div>
                <label className="text-sm font-medium text-foreground block mb-3">Secondary Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brandData.secondaryColor}
                    onChange={(e) => handleColorChange("secondaryColor", e.target.value)}
                    className="w-12 h-12 rounded-lg cursor-pointer border border-border"
                  />
                  <Input
                    value={brandData.secondaryColor}
                    onChange={(e) => handleColorChange("secondaryColor", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            <Button>Save Brand Colors</Button>
          </CardContent>
        </AnimatedCard>

        {/* Theme Preview */}
        <AnimatedCard delay={0.4}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Theme Preview
            </CardTitle>
            <CardDescription>Preview your branding changes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Button
                variant={previewTheme === "light" ? "default" : "outline"}
                onClick={() => setPreviewTheme("light")}
                className="bg-transparent"
              >
                Light Mode
              </Button>
              <Button
                variant={previewTheme === "dark" ? "default" : "outline"}
                onClick={() => setPreviewTheme("dark")}
                className="bg-transparent"
              >
                Dark Mode
              </Button>
            </div>

            <div
              className={`p-6 rounded-lg border border-border ${
                previewTheme === "dark" ? "bg-slate-900 text-white" : "bg-white text-black"
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: brandData.primaryColor }}></div>
                  <span className="font-bold">{brandData.workspaceName}</span>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Color Palette Preview:</p>
                  <div className="flex gap-3">
                    <div
                      className="w-16 h-16 rounded-lg border border-gray-300"
                      style={{ backgroundColor: brandData.primaryColor }}
                      title="Primary"
                    ></div>
                    <div
                      className="w-16 h-16 rounded-lg border border-gray-300"
                      style={{ backgroundColor: brandData.accentColor }}
                      title="Accent"
                    ></div>
                    <div
                      className="w-16 h-16 rounded-lg border border-gray-300"
                      style={{ backgroundColor: brandData.secondaryColor }}
                      title="Secondary"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </AnimatedCard>
      </div>
    </AppLayout>
  )
}
