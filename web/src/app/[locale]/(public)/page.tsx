"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function fetchProperties() {
  const res = await fetch("/api/properties");
  if (!res.ok) throw new Error("Failed to fetch properties");
  const json = await res.json();
  return json.data.data;
}

export default function HomePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["properties"],
    queryFn: fetchProperties,
  });

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Daftar Properti</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.map((property: Record<string, unknown>) => (
          <Card key={property.id as string}>
            <CardHeader>
              <CardTitle>{property.name as string}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-2">
                {property.address as string}
              </p>
              <p className="text-sm capitalize">{property.type as string}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
