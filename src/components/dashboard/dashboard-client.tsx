
"use client";

import { useInventory } from '@/lib/inventory-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Boxes, TrendingUp, TrendingDown, DollarSign, LayoutGrid } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { InventoryItem } from '@/types/inventory';

interface CategorySummary {
  categoryName: string;
  uniqueItems: number;
  totalQuantity: number;
  totalValue: number;
}

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

  const totalInventoryValue = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
  }, [items]);

  const categorySummary = useMemo(() => {
    if (!items.length) return [];
    const summary: Record<string, { uniqueItems: number, totalQuantity: number, totalValue: number }> = {};
    items.forEach(item => {
      const category = item.category || 'Sin Categoría';
      if (!summary[category]) {
        summary[category] = { uniqueItems: 0, totalQuantity: 0, totalValue: 0 };
      }
      summary[category].uniqueItems += 1;
      summary[category].totalQuantity += item.quantity;
      summary[category].totalValue += (item.price || 0) * item.quantity;
    });
    return Object.entries(summary).map(([categoryName, data]) => ({
      categoryName,
      ...data
    })).sort((a,b) => a.categoryName.localeCompare(b.categoryName));
  }, [items]);


  if (!isInitialized) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {[...Array(5)].map((_, i) => (
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
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-1/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
            <CardTitle className="text-sm font-medium">Valor Total del Inventario</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalInventoryValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Suma de (cantidad x precio)</p>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <LayoutGrid className="h-5 w-5 mr-2 text-muted-foreground" />
            Resumen por Categoría
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categorySummary.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-right">Artículos Únicos</TableHead>
                    <TableHead className="text-right">Cantidad Total</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categorySummary.map((summary) => (
                    <TableRow key={summary.categoryName}>
                      <TableCell className="font-medium">{summary.categoryName}</TableCell>
                      <TableCell className="text-right">{summary.uniqueItems}</TableCell>
                      <TableCell className="text-right">{summary.totalQuantity}</TableCell>
                      <TableCell className="text-right">${summary.totalValue.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No hay artículos con categorías definidas para mostrar un resumen.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

