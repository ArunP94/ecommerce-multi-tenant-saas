export const dynamic = "force-dynamic";

import { requireStoreAccess } from "@/lib/require-store";
import { ChartAreaInteractive } from "@/components/domain/admin/chart-area-interactive";
import data from "@/app/admin/data.json";
import { DataTable } from "@/components/domain/admin/data-table";
import { MetricCard } from "@/components/primitives";

const metrics = [
  {
    title: "Total Revenue",
    value: "$1,250.00",
    trend: { direction: "up" as const, percentage: 12.5 },
    footer: "Trending up this month",
    description: "Visitors for the last 6 months",
  },
  {
    title: "New Customers",
    value: "1,234",
    trend: { direction: "down" as const, percentage: 20 },
    footer: "Down 20% this period",
    description: "Acquisition needs attention",
  },
  {
    title: "Active Accounts",
    value: "45,678",
    trend: { direction: "up" as const, percentage: 12.5 },
    footer: "Strong user retention",
    description: "Engagement exceed targets",
  },
  {
    title: "Growth Rate",
    value: "4.5%",
    trend: { direction: "up" as const, percentage: 4.5 },
    footer: "Steady performance increase",
    description: "Meets growth projections",
  },
];

export default async function StoreDashboard({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  await requireStoreAccess(storeId);

  return (
    <>
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <DataTable data={data} />
    </>
  );
}
