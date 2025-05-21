import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const metadata = {
  title: 'Dashboard - QMD Inventario',
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Un resumen de tu inventario.
        </p>
      </div>
      <DashboardClient />
    </div>
  );
}
