import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export default function StatsCard({
  title,
  value,
  icon,
  trend,
  className = "",
}: StatsCardProps) {
  return (
    <div className={`rounded-lg bg-white p-6 shadow-md ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p
              className={`mt-1 text-sm ${trend.isPositive ? "text-green-600" : "text-red-600"}`}
            >
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}% dari
              periode sebelumnya
            </p>
          )}
        </div>
        <div className="text-4xl text-gray-400">{icon}</div>
      </div>
    </div>
  );
}