"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import axios from "axios";
import { InsightCard } from "@/components/ai/InsightCard";
import { RiskCard } from "@/components/ai/RiskCard";

interface Insight {
  type: "risk" | "opportunity" | "trend" | "anomaly";
  category: string;
  title: string;
  description: string;
  severity?: "low" | "medium" | "high";
  recommendations: string[];
  data: Record<string, any>;
}

interface RiskScore {
  score: number;
  level: "low" | "medium" | "high" | "critical";
  factors: Array<{ name: string; weight: number; contribution: number }>;
  recommendations: string[];
}

export default function AIInsightsPage() {
  const { user } = useAuthGuard();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [risks, setRisks] = useState<{
    company: RiskScore | null;
    departments: Array<{
      departmentId: string;
      departmentName: string;
      riskScore: number;
      riskFactors: string[];
    }>;
  }>({ company: null, departments: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInsights();
    fetchRisks();
  }, []);

  const fetchInsights = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5500"}/api/v1/ai/insights`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      setInsights(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load insights");
    } finally {
      setLoading(false);
    }
  };

  const fetchRisks = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5500"}/api/v1/ai/risks`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      setRisks(response.data || { company: null, departments: [] });
    } catch (err: any) {
      console.error("Failed to load risks:", err);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Insights</h1>
        <p className="text-muted-foreground mt-2">
          Intelligent insights and risk analysis for your company
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Risk Overview */}
      {risks.company && (
        <Card>
          <CardHeader>
            <CardTitle>Company Risk Score</CardTitle>
            <CardDescription>Overall company health assessment</CardDescription>
          </CardHeader>
          <CardContent>
            <RiskCard risk={risks.company} />
          </CardContent>
        </Card>
      )}

      {/* High-Risk Departments */}
      {risks.departments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>High-Risk Departments</CardTitle>
            <CardDescription>Departments requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {risks.departments.map((dept) => (
                <div key={dept.departmentId} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{dept.departmentName}</h3>
                    <Badge variant={dept.riskScore > 75 ? "destructive" : dept.riskScore > 50 ? "default" : "secondary"}>
                      Risk: {dept.riskScore}
                    </Badge>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {dept.riskFactors.map((factor, idx) => (
                      <li key={idx}>• {factor}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights Grid */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights.map((insight, index) => (
            <InsightCard key={index} insight={insight} />
          ))}
        </div>
        {insights.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No insights available yet. Insights will appear as your company data grows.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

