import SalesChart from '@/components/admin/SalesChart';
import DishRankings from '@/components/admin/DishRankings';
import TableRevenueChart from '@/components/admin/TableRevenueChart';
import KitchenStatsCard from '@/components/admin/KitchenStatsCard';
import StaffReport from '@/components/admin/StaffReport';
import DishRevenueChart from '@/components/admin/DishRevenueChart';
import CategoryBreakdown from '@/components/admin/CategoryBreakdown';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">Sales performance and analytics</p>
      </div>

      <SalesChart />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DishRevenueChart />
        <CategoryBreakdown />
      </div>

      <TableRevenueChart />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <KitchenStatsCard />
        <StaffReport />
      </div>

      <DishRankings />
    </div>
  );
}
