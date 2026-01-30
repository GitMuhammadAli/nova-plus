import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, Palette } from "lucide-react";
import { motion } from "framer-motion";

export function WorkspaceBranding() {
  const [workspaceName, setWorkspaceName] = useState("NovaPulse");
  const [accentColor, setAccentColor] = useState("#6366F1");

  const handleLogoUpload = () => {
    // Placeholder for logo upload
    console.log("Logo upload triggered");
  };

  const handleFaviconUpload = () => {
    // Placeholder for favicon upload
    console.log("Favicon upload triggered");
  };

  const handleSave = () => {
    console.log("Saving branding:", { workspaceName, accentColor });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Workspace Identity</h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="workspace-name">Workspace Name</Label>
            <Input
              id="workspace-name"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="Enter workspace name"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Logo</Label>
            <div className="mt-2 flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
                {workspaceName.charAt(0)}
              </div>
              <Button variant="outline" onClick={handleLogoUpload}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Logo
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Recommended: Square image, at least 256x256px
            </p>
          </div>

          <div>
            <Label>Favicon</Label>
            <div className="mt-2">
              <Button variant="outline" onClick={handleFaviconUpload}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Favicon
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Recommended: 32x32px or 64x64px .ico or .png
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Brand Colors</h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="accent-color">Primary Accent Color</Label>
            <div className="mt-2 flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-lg border-2 border-border"
                style={{ backgroundColor: accentColor }}
              />
              <Input
                id="accent-color"
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-24 h-10"
              />
              <Input
                type="text"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                placeholder="#6366F1"
                className="flex-1"
              />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setAccentColor("#6366F1")}
              className="w-10 h-10 rounded-lg bg-[#6366F1] hover:ring-2 ring-ring transition-all"
              title="Nova Indigo"
            />
            <button
              onClick={() => setAccentColor("#3B82F6")}
              className="w-10 h-10 rounded-lg bg-[#3B82F6] hover:ring-2 ring-ring transition-all"
              title="Sapphire"
            />
            <button
              onClick={() => setAccentColor("#27C499")}
              className="w-10 h-10 rounded-lg bg-[#27C499] hover:ring-2 ring-ring transition-all"
              title="Mint"
            />
            <button
              onClick={() => setAccentColor("#EF4444")}
              className="w-10 h-10 rounded-lg bg-[#EF4444] hover:ring-2 ring-ring transition-all"
              title="Coral"
            />
            <button
              onClick={() => setAccentColor("#8B5CF6")}
              className="w-10 h-10 rounded-lg bg-[#8B5CF6] hover:ring-2 ring-ring transition-all"
              title="Purple"
            />
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Palette className="w-4 h-4 mr-2" />
          Save Branding
        </Button>
      </div>
    </motion.div>
  );
}
