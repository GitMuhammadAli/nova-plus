import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { 
  Palette, 
  Monitor, 
  Layout, 
  FileText, 
  LayoutDashboard,
  Webhook,
  User,
  Bell,
  Shield
} from "lucide-react";
import { WorkspaceBranding } from "@/components/settings/WorkspaceBranding";
import { ThemeCustomizer } from "@/components/settings/ThemeCustomizer";
import { SidebarConfig } from "@/components/settings/SidebarConfig";
import { CustomPages } from "@/components/settings/CustomPages";
import { DashboardWidgets } from "@/components/settings/DashboardWidgets";
import { WebhooksConfig } from "@/components/settings/WebhooksConfig";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("branding");

  return (
    <AppShell>
      <div className="p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Customize your workspace, theme, and integrations
          </p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 gap-2 bg-transparent h-auto p-0">
            <TabsTrigger 
              value="branding" 
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Branding</span>
            </TabsTrigger>
            <TabsTrigger 
              value="theme"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Monitor className="w-4 h-4" />
              <span className="hidden sm:inline">Theme</span>
            </TabsTrigger>
            <TabsTrigger 
              value="sidebar"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Layout className="w-4 h-4" />
              <span className="hidden sm:inline">Sidebar</span>
            </TabsTrigger>
            <TabsTrigger 
              value="pages"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Pages</span>
            </TabsTrigger>
            <TabsTrigger 
              value="dashboard"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger 
              value="webhooks"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Webhook className="w-4 h-4" />
              <span className="hidden sm:inline">Webhooks</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="branding">
              <WorkspaceBranding />
            </TabsContent>

            <TabsContent value="theme">
              <ThemeCustomizer />
            </TabsContent>

            <TabsContent value="sidebar">
              <SidebarConfig />
            </TabsContent>

            <TabsContent value="pages">
              <CustomPages />
            </TabsContent>

            <TabsContent value="dashboard">
              <DashboardWidgets />
            </TabsContent>

            <TabsContent value="webhooks">
              <WebhooksConfig />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </AppShell>
  );
}
