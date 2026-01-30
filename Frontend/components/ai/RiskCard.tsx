"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";

interface RiskScore {
  score: number;
  level: "low" | "medium" | "high" | "critical";
  factors: Array<{ name: string; weight: number; contribution: number }>;
  recommendations: string[];
}

interface RiskCardProps {
  risk: RiskScore;
}

export function RiskCard({ risk }: RiskCardProps) {
  const getLevelColor = () => {
    switch (risk.level) {
      case "critical":
        return "destructive";
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

  const getLevelIcon = () => {
    switch (risk.level) {
      case "critical":
      case "high":
        return <AlertTriangle className="w-5 h-5 text-destructive" />;
      case "medium":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case "low":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getLevelIcon()}
          <div>
            <h3 className="font-semibold">Risk Score: {risk.score}/100</h3>
            <p className="text-sm text-muted-foreground">Level: {risk.level}</p>
          </div>
        </div>
        <Badge variant={getLevelColor()}>{risk.level.toUpperCase()}</Badge>
      </div>

      <Progress value={risk.score} className="h-2" />

      {risk.factors.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Risk Factors:</h4>
          <div className="space-y-2">
            {risk.factors.map((factor, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span>{factor.name}</span>
                <span className="text-muted-foreground">
                  {Math.round(factor.contribution * factor.weight * 100) / 100}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {risk.recommendations.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Recommendations:</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {risk.recommendations.map((rec, idx) => (
              <li key={idx}>• {rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

