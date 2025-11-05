import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface ExecutionStep {
  id: string;
  nodeId: string;
  nodeName: string;
  status: "pending" | "running" | "success" | "failed" | "skipped";
  startTime: Date;
  endTime?: Date;
  error?: string;
  output?: any;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: "running" | "completed" | "failed" | "cancelled";
  startTime: Date;
  endTime?: Date;
  trigger: any;
  steps: ExecutionStep[];
}

interface WorkflowExecutionLogProps {
  execution: WorkflowExecution;
}

const statusIcons = {
  pending: Clock,
  running: AlertCircle,
  success: CheckCircle2,
  failed: XCircle,
  skipped: AlertCircle,
};

const statusColors = {
  pending: "text-muted-foreground",
  running: "text-primary",
  success: "text-green-500",
  failed: "text-destructive",
  skipped: "text-yellow-500",
};

export function WorkflowExecutionLog({ execution }: WorkflowExecutionLogProps) {
  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{execution.workflowName}</h3>
            <p className="text-sm text-muted-foreground">
              Started {formatDistanceToNow(execution.startTime, { addSuffix: true })}
            </p>
          </div>
          <Badge
            variant={
              execution.status === "completed"
                ? "default"
                : execution.status === "failed"
                ? "destructive"
                : "secondary"
            }
          >
            {execution.status}
          </Badge>
        </div>

        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {execution.steps.map((step, index) => {
              const Icon = statusIcons[step.status];
              const duration = step.endTime
                ? `${Math.round((step.endTime.getTime() - step.startTime.getTime()) / 1000)}s`
                : "...";

              return (
                <div
                  key={step.id}
                  className="flex gap-3 p-3 rounded-lg border bg-card"
                >
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`p-2 rounded-full ${statusColors[step.status]}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    {index < execution.steps.length - 1 && (
                      <div className="w-0.5 h-full bg-border" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{step.nodeName}</span>
                      <span className="text-xs text-muted-foreground">
                        {duration}
                      </span>
                    </div>

                    {step.error && (
                      <p className="text-xs text-destructive">{step.error}</p>
                    )}

                    {step.output && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          View output
                        </summary>
                        <pre className="mt-2 p-2 rounded bg-muted overflow-x-auto">
                          {JSON.stringify(step.output, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
}
