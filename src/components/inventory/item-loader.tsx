"use client";

import { ItemForm } from '@/components/inventory/item-form';
import { useInventory } from '@/lib/inventory-store';
import { useEffect, useState } from 'react';
import type { InventoryItem } from '@/types/inventory';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface ItemLoaderProps {
  itemId: string;
}

export function ItemLoader({ itemId }: ItemLoaderProps) {
  const { getItemById, isInitialized } = useInventory();
  const [item, setItem] = useState<InventoryItem | undefined | null>(null); // null for loading, undefined if not found

  useEffect(() => {
    if (isInitialized) {
      const fetchedItem = getItemById(itemId);
      setItem(fetchedItem);
    }
  }, [itemId, getItemById, isInitialized]);

  if (!isInitialized || item === null) {
    return (
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

  return <ItemForm item={item} />;
}
