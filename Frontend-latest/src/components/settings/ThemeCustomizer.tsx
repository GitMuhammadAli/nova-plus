import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Moon, Sun, Monitor } from "lucide-react";
import { motion } from "framer-motion";

type ThemeMode = "light" | "dark" | "system";

export function ThemeCustomizer() {
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [compactMode, setCompactMode] = useState(false);

  const handleSave = () => {
    console.log("Saving theme:", { themeMode, reducedMotion, compactMode });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Appearance</h3>
        
        <div className="space-y-4">
          <div>
            <Label>Theme Mode</Label>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <button
                onClick={() => setThemeMode("light")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  themeMode === "light"
                    ? "border-primary bg-primary-subtle"
                    : "border-border hover:border-muted-foreground"
                }`}
              >
                <Sun className="w-6 h-6 mx-auto mb-2 text-foreground" />
                <p className="text-sm font-medium text-foreground">Light</p>
              </button>
              
              <button
                onClick={() => setThemeMode("dark")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  themeMode === "dark"
                    ? "border-primary bg-primary-subtle"
                    : "border-border hover:border-muted-foreground"
                }`}
              >
                <Moon className="w-6 h-6 mx-auto mb-2 text-foreground" />
                <p className="text-sm font-medium text-foreground">Dark</p>
              </button>
              
              <button
                onClick={() => setThemeMode("system")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  themeMode === "system"
                    ? "border-primary bg-primary-subtle"
                    : "border-border hover:border-muted-foreground"
                }`}
              >
                <Monitor className="w-6 h-6 mx-auto mb-2 text-foreground" />
                <p className="text-sm font-medium text-foreground">System</p>
              </button>
            </div>
          </div>

          <div className="pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="compact-mode">Compact Mode</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Reduce spacing and padding for a denser layout
                </p>
              </div>
              <Switch
                id="compact-mode"
                checked={compactMode}
                onCheckedChange={setCompactMode}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="reduced-motion">Reduce Motion</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Minimize animations for accessibility
                </p>
              </div>
              <Switch
                id="reduced-motion"
                checked={reducedMotion}
                onCheckedChange={setReducedMotion}
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Theme Settings</Button>
      </div>
    </motion.div>
  );
}
