import { requireStoreAccess } from "@/lib/require-store";
import { SectionCards } from "@/components/admin/section-cards";
import { ChartAreaInteractive } from "@/components/admin/chart-area-interactive";
import data from "../data.json";
import { DataTable } from "@/components/admin/data-table";

export default async function StoreDashboard({ params }: { params: { storeId: string } }) {
  await requireStoreAccess(params.storeId);

  return (
    <>
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <DataTable data={data} />
    </>
  );
}
