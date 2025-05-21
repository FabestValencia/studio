import { InventoryListClient } from '@/components/inventory/inventory-list-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PackagePlus } from 'lucide-react';

export const metadata = {
  title: 'Lista de Inventario - QMD',
};

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
          <p className="text-muted-foreground">
            Gestiona los artículos de tu inventario.
          </p>
        </div>
        <Link href="/inventario/nuevo" passHref className="invisible">
          <Button tabIndex={-1}>
            <PackagePlus className="mr-2 h-4 w-4" />
            Añadir Nuevo Artículo
          </Button>
        </Link>
      </div>
      <InventoryListClient />
    </div>
  );
}
