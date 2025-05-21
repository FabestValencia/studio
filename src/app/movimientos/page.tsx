
import { MovementListClient } from '@/components/movements/movement-list-client';
import { History } from 'lucide-react';

export const metadata = {
  title: 'Historial de Movimientos - QMD Inventario',
};

export default function MovementsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <History className="mr-3 h-8 w-8 text-muted-foreground" />
          Historial de Movimientos
        </h1>
        <p className="text-muted-foreground">
          Todas las entradas y salidas de inventario registradas.
        </p>
      </div>
      <MovementListClient />
    </div>
  );
}
