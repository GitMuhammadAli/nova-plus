import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";

export default function Analytics() {
  return (
    <AppShell>
      <div className="p-8">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">Coming soon...</p>
        <Card className="mt-6 p-8 text-center">
          <p className="text-muted-foreground">Analytics page will be built in the next phase</p>
        </Card>
      </div>
    </AppShell>
  );
}
