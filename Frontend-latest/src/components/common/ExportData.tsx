import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ExportDataProps {
  data: any[];
  filename?: string;
  headers?: string[];
}

export function ExportData({ data, filename = "export", headers }: ExportDataProps) {
  const exportToCSV = () => {
    if (data.length === 0) {
      return;
    }

    // Get headers from first object if not provided
    const csvHeaders = headers || Object.keys(data[0]);

    // Create CSV content
    const csvContent = [
      csvHeaders.join(","),
      ...data.map((row) =>
        csvHeaders.map((header) => {
          const value = row[header] || "";
          // Escape quotes and wrap in quotes if contains comma or quote
          return typeof value === "string" && (value.includes(",") || value.includes('"'))
            ? `"${value.replace(/"/g, '""')}"`
            : value;
        }).join(",")
      ),
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button variant="outline" className="gap-2" onClick={exportToCSV} disabled={data.length === 0}>
      <Download className="w-4 h-4" />
      Export
    </Button>
  );
}

