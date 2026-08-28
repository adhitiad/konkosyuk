import { Metadata } from "next";
import { RedocStandalone } from "@/components/docs/redoc-standalone";

export const metadata: Metadata = {
  title: "API Documentation - KonkosYuk",
};

async function getOpenApiSpec() {
  const fs = await import("fs");
  const path = await import("path");

  const specPath = path.join(process.cwd(), "docs", "openapi.yaml");
  const spec = fs.readFileSync(specPath, "utf-8");

  return spec;
}

export default async function ApiDocsPage() {
  const spec = await getOpenApiSpec();

  return (
    <div className="min-h-screen bg-white">
      <RedocStandalone spec={spec} />
    </div>
  );
}
