"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, Lightbulb, Activity } from "lucide-react";

interface Insight {
  type: "risk" | "opportunity" | "trend" | "anomaly";
  category: string;
  title: string;
  description: string;
  severity?: "low" | "medium" | "high";
  recommendations: string[];
  data: Record<string, any>;
}

interface InsightCardProps {
  insight: Insight;
}

export function InsightCard({ insight }: InsightCardProps) {
  const getIcon = () => {
    switch (insight.type) {
      case "risk":
        return <AlertTriangle className="w-5 h-5 text-destructive" />;
      case "opportunity":
        return <Lightbulb className="w-5 h-5 text-yellow-500" />;
      case "trend":
        return <TrendingUp className="w-5 h-5 text-primary" />;
      case "anomaly":
        return <Activity className="w-5 h-5 text-orange-500" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  const getSeverityColor = () => {
    switch (insight.severity) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getIcon()}
            <CardTitle className="text-lg">{insight.title}</CardTitle>
          </div>
          <Badge variant={getSeverityColor()}>{insight.type}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{insight.description}</p>
        {insight.recommendations.length > 0 && (
          <div>
            <p className="text-xs font-semibold mb-2">Recommendations:</p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {insight.recommendations.map((rec, idx) => (
                <li key={idx}>• {rec}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

