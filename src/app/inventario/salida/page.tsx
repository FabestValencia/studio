
import { StockOutputForm } from '@/components/inventory/stock-output-form';
import { LogOut } from 'lucide-react';

export const metadata = {
  title: 'Registrar Salida de Artículo - QMD Inventario',
};

export default function StockOutputPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <LogOut className="mr-3 h-8 w-8 text-muted-foreground" />
          Registrar Salida de Artículo
        </h1>
        <p className="text-muted-foreground">
          Selecciona un artículo, la cantidad y la razón para registrar una salida del inventario.
        </p>
      </div>
      <StockOutputForm />
    </div>
  );
}
