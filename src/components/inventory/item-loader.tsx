
"use client";

import { ItemForm } from '@/components/inventory/item-form';
import { useInventory } from '@/lib/inventory-store';
import { useEffect, useState } from 'react';
import type { InventoryItem, InventoryMovement } from '@/types/inventory';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ItemMovementsList } from './item-movements-list';

interface ItemLoaderProps {
  itemId: string;
}

export function ItemLoader({ itemId }: ItemLoaderProps) {
  const { getItemById, getMovementsByItemId, isInitialized } = useInventory();
  const [item, setItem] = useState<InventoryItem | undefined | null>(null); // null for loading, undefined if not found
  const [movements, setMovements] = useState<InventoryMovement[]>([]);

  useEffect(() => {
    if (isInitialized) {
      const fetchedItem = getItemById(itemId);
      setItem(fetchedItem);
      if (fetchedItem) {
        setMovements(getMovementsByItemId(itemId));
      } else {
        setMovements([]);
      }
    }
  }, [itemId, getItemById, getMovementsByItemId, isInitialized]);

  if (!isInitialized || item === null) {
    return (
      <div className="space-y-8">
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
         <Card className="w-full max-w-2xl mx-auto">
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

  if (item === undefined) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Artículo no encontrado</CardTitle>
        </CardHeader>
        <CardContent>
          <p>El artículo que intentas editar no existe o ha sido eliminado.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <ItemForm item={item} />
      <ItemMovementsList movements={movements} />
    </div>
  );
}
