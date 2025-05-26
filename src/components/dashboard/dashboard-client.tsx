
"use client";

import { useInventory } from '@/lib/inventory-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Boxes, TrendingUp, TrendingDown, DollarSign, LayoutGrid, BarChart3, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { InventoryItem } from '@/types/inventory';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import Link from 'next/link';


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

  const top5MostStockedItems = useMemo(() => {
    if (!items.length) return [];
    return [...items]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
      .map(item => ({ name: item.name, quantity: item.quantity }))
      .reverse(); // Reverse for vertical bar chart to show largest at top
  }, [items]);

  const chartConfig = {
    quantity: {
      label: "Cantidad",
      color: "hsl(var(--chart-1))",
    },
  };


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
        <Card>
          <CardHeader>
             <Skeleton className="h-7 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[250px] w-full" />
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
        <Link href="/inventario?status=low_stock" className="group">
          <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Artículos con Stock Bajo</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground group-hover:text-destructive transition-colors" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${lowStockItemsCount > 0 ? 'text-destructive' : ''}`}>{lowStockItemsCount}</div>
              <p className="text-xs text-muted-foreground">Artículos por debajo de su umbral</p>
            </CardContent>
          </Card>
        </Link>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-muted-foreground" />
            Top 5 Artículos Más Stockeados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {top5MostStockedItems.length > 0 ? (
            <ChartContainer config={chartConfig} className="min-h-[250px] w-full sm:min-h-[300px] md:min-h-[350px]">
              <BarChart
                accessibilityLayer
                data={top5MostStockedItems}
                layout="vertical"
                margin={{ left: 10, right: 10, top:5, bottom: 5 }}
              >
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis type="number" dataKey="quantity" allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  width={100} 
                  tickFormatter={(value) => value.length > 15 ? `${value.substring(0,15)}...` : value}
                />
                <ChartTooltip
                  cursor={{ fill: "hsl(var(--muted))", radius: 4 }}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="quantity" fill="var(--color-quantity)" radius={4} barSize={20}/>
              </BarChart>
            </ChartContainer>
          ) : (
             <p className="text-sm text-muted-foreground">No hay suficientes datos de artículos para mostrar el gráfico.</p>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
