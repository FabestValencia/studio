
import { StockInputForm } from '@/components/inventory/stock-input-form';
import { LogIn } from 'lucide-react';

export const metadata = {
  title: 'Registrar Entrada de Artículo - QMD Inventario',
};

export default function StockInputPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <LogIn className="mr-3 h-8 w-8 text-muted-foreground" />
          Registrar Entrada de Artículo
        </h1>
        <p className="text-muted-foreground">
          Selecciona un artículo, la cantidad y la razón para registrar una entrada al inventario.
        </p>
      </div>
      <StockInputForm />
    </div>
  );
}
