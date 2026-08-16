import { CsvBuffer } from "@/lib/perf";

export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (!data || data.length === 0) {
    throw new Error("No data to export");
  }

  const headers = Object.keys(data[0]);
  const csv = new CsvBuffer();

  // Header line
  csv.appendLine(headers.join(","));

  // Data rows
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowParts: string[] = [];
    for (let j = 0; j < headers.length; j++) {
      const value = row[headers[j]];
      const stringValue =
        value === null || value === undefined ? "" : String(value);
      if (
        stringValue.includes(",") ||
        stringValue.includes('"') ||
        stringValue.includes("\n")
      ) {
        rowParts.push(`"${stringValue.replace(/"/g, '""')}"`);
      } else {
        rowParts.push(stringValue);
      }
    }
    csv.appendLine(rowParts.join(","));
  }

  const blob = csv.toBlob();
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

