"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Download, Calendar } from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import axios from "axios";

export default function AIReportsPage() {
  const { user } = useAuthGuard();
  const [loading, setLoading] = useState(false);
  const [dailySummary, setDailySummary] = useState<string>("");
  const [weeklySummary, setWeeklySummary] = useState<string>("");
  const [departmentSummary, setDepartmentSummary] = useState<Record<string, string>>({});

  const generateSummary = async (type: "daily" | "weekly" | "department", departmentId?: string) => {
    setLoading(true);
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5500"}/api/v1/ai/summary/${type}`;
      const response = await axios.get(url, {
        params: departmentId ? { departmentId } : {},
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      
      if (type === "daily") {
        setDailySummary(response.data || "");
      } else if (type === "weekly") {
        setWeeklySummary(response.data || "");
      } else if (departmentId) {
        setDepartmentSummary((prev) => ({
          ...prev,
          [departmentId]: response.data || "",
        }));
      }
    } catch (error: any) {
      console.error("Failed to generate summary:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Reports</h1>
        <p className="text-muted-foreground mt-2">
          AI-generated summaries and analytics reports
        </p>
      </div>

      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily">Daily Summary</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Summary</TabsTrigger>
          <TabsTrigger value="department">Department Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Daily Summary</CardTitle>
                  <CardDescription>AI-generated daily activity summary</CardDescription>
                </div>
                <Button
                  onClick={() => generateSummary("daily")}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Calendar className="w-4 h-4 mr-2" />
                  )}
                  Generate
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {dailySummary ? (
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{dailySummary}</p>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Click "Generate" to create a daily summary
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Weekly Summary</CardTitle>
                  <CardDescription>AI-generated weekly trends and insights</CardDescription>
                </div>
                <Button
                  onClick={() => generateSummary("weekly")}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Calendar className="w-4 h-4 mr-2" />
                  )}
                  Generate
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {weeklySummary ? (
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{weeklySummary}</p>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Click "Generate" to create a weekly summary
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="department">
          <Card>
            <CardHeader>
              <CardTitle>Department Reports</CardTitle>
              <CardDescription>Generate AI reports for specific departments</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Department-specific reports will be available here. Select a department to generate a report.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

