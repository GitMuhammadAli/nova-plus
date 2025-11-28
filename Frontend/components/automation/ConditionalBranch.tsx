import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { Condition } from "@/types/automation";

export interface ConditionalBranchData {
  logic: "AND" | "OR";
  conditions: Condition[];
}

interface ConditionalBranchProps {
  data?: ConditionalBranchData;
  onSave: (data: ConditionalBranchData) => void;
}

export function ConditionalBranch({ data, onSave }: ConditionalBranchProps) {
  const [logic, setLogic] = useState<"AND" | "OR">(data?.logic || "AND");
  const [conditions, setConditions] = useState<Condition[]>(
    data?.conditions || []
  );

  const addCondition = () => {
    const newCondition: Condition = {
      id: `cond-${Date.now()}`,
      field: "",
      operator: "equals",
      value: "",
    };
    setConditions([...conditions, newCondition]);
  };

  const removeCondition = (id: string) => {
    setConditions(conditions.filter((c) => c.id !== id));
  };

  const updateCondition = (id: string, updates: Partial<Condition>) => {
    setConditions(
      conditions.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const handleSave = () => {
    onSave({ logic, conditions });
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div>
          <Label>Branch Logic</Label>
          <Select value={logic} onValueChange={(v) => setLogic(v as "AND" | "OR")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AND">Match ALL conditions</SelectItem>
              <SelectItem value="OR">Match ANY condition</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Conditions</Label>
          {conditions.map((condition) => (
            <div key={condition.id} className="flex gap-2 items-end">
              <div className="flex-1 grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Field</Label>
                  <Input
                    placeholder="e.g. email"
                    value={condition.field}
                    onChange={(e) =>
                      updateCondition(condition.id, { field: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Operator</Label>
                  <Select
                    value={condition.operator}
                    onValueChange={(v) =>
                      updateCondition(condition.id, { operator: v as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="not_equals">Not Equals</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="not_contains">Not Contains</SelectItem>
                      <SelectItem value="greater_than">Greater Than</SelectItem>
                      <SelectItem value="less_than">Less Than</SelectItem>
                      <SelectItem value="starts_with">Starts With</SelectItem>
                      <SelectItem value="ends_with">Ends With</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Value</Label>
                  <Input
                    placeholder="Value"
                    value={condition.value}
                    onChange={(e) =>
                      updateCondition(condition.id, { value: e.target.value })
                    }
                  />
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => removeCondition(condition.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={addCondition}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Condition
          </Button>
        </div>

        <Button onClick={handleSave} className="w-full">
          Save Branch Logic
        </Button>
      </div>
    </Card>
  );
}
