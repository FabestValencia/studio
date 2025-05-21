"use client";

import { useInventory } from '@/lib/inventory-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Boxes, TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';

export function DashboardClient() {
  const { items, isInitialized } = useInventory();

  const totalItems = useMemo(() => items.length, [items]);
  const totalQuantity = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  
  const lowStockItemsCount = useMemo(() => {
    return items.filter(item => typeof item.lowStockThreshold === 'number' && item.quantity < item.lowStockThreshold).length;
  }, [items]);

  const mostStockedItem = useMemo(() => {
    if (!items.length) return null;
    return items.reduce((max, item) => item.quantity > max.quantity ? item : max, items[0]);
  }, [items]);

  const leastStockedItem = useMemo(() => {
    if (!items.length) return null;
    return items.reduce((min, item) => item.quantity < min.quantity ? item : min, items[0]);
  }, [items]);


  if (!isInitialized) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/3 mb-1" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Artículos Únicos</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalItems}</div>
          <p className="text-xs text-muted-foreground">Diferentes tipos de productos</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cantidad Total en Stock</CardTitle>
          <Boxes className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalQuantity}</div>
          <p className="text-xs text-muted-foreground">Unidades totales de todos los artículos</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Artículos con Stock Bajo</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{lowStockItemsCount}</div>
          <p className="text-xs text-muted-foreground">Artículos por debajo de su umbral</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Más Stockeado</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {mostStockedItem ? (
            <>
              <div className="text-xl font-bold truncate" title={mostStockedItem.name}>{mostStockedItem.name}</div>
              <p className="text-xs text-muted-foreground">Con {mostStockedItem.quantity} unidades</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">N/A</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
