
"use client";

import type { InventoryItem, InventoryItemFormValues, InventoryMovement, InventoryMovementType } from '@/types/inventory';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";

const ITEMS_STORAGE_KEY = 'qmd_inventory_items';
const MOVEMENTS_STORAGE_KEY = 'qmd_inventory_movements';

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedItems = localStorage.getItem(ITEMS_STORAGE_KEY);
      if (storedItems) {
        setItems(JSON.parse(storedItems));
      }
      const storedMovements = localStorage.getItem(MOVEMENTS_STORAGE_KEY);
      if (storedMovements) {
        setMovements(JSON.parse(storedMovements));
      }
    } catch (error) {
      console.error("Error loading data from localStorage:", error);
      toast({ title: "Error de Carga", description: "No se pudieron cargar los datos guardados.", variant: "destructive" });
    }
    setIsInitialized(true);
  }, [toast]);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(MOVEMENTS_STORAGE_KEY, JSON.stringify(movements));
    }
  }, [movements, isInitialized]);

  const checkAndNotifyLowStock = useCallback((item: InventoryItem, oldQuantity?: number) => {
    if (item.lowStockThreshold !== undefined && item.quantity < item.lowStockThreshold) {
      const justCrossedThreshold = oldQuantity !== undefined && oldQuantity >= item.lowStockThreshold;
      const isNewAndLow = oldQuantity === undefined; // Item is new and already below threshold

      if (justCrossedThreshold || isNewAndLow) {
        toast({
          title: "Alerta de Stock Bajo",
          description: `El artículo "${item.name}" solo tiene ${item.quantity} unidades. (Umbral: ${item.lowStockThreshold})`,
          variant: "default",
        });
      }
    }
  }, [toast]);

  const addMovement = useCallback((
    itemId: string,
    itemName: string,
    type: InventoryMovementType,
    quantityChanged: number,
    reason: string
  ) => {
    if (quantityChanged <= 0) return;
    const newMovement: InventoryMovement = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9), // Simpler unique ID for localStorage
      itemId,
      itemName,
      type,
      quantityChanged: Math.abs(quantityChanged),
      reason,
      date: new Date().toISOString(),
    };
    setMovements(prevMovements => [newMovement, ...prevMovements].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, []);


  const addItem = useCallback((itemData: InventoryItemFormValues): InventoryItem | undefined => {
    const newItem: InventoryItem = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      name: itemData.name,
      description: itemData.description || '',
      quantity: Number(itemData.quantity),
      price: itemData.price !== undefined && itemData.price !== '' ? Number(itemData.price) : undefined,
      category: itemData.category || '',
      dateAdded: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      lowStockThreshold: itemData.lowStockThreshold !== undefined && itemData.lowStockThreshold !== '' ? Number(itemData.lowStockThreshold) : undefined,
    };
    setItems(prevItems => [newItem, ...prevItems].sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()));
    
    if (newItem.quantity > 0) {
        addMovement(newItem.id, newItem.name, 'entrada', newItem.quantity, 'Alta inicial de artículo');
    }
    checkAndNotifyLowStock(newItem);
    return newItem;
  }, [addMovement, checkAndNotifyLowStock]);

  const updateItem = useCallback((id: string, updatedData: InventoryItemFormValues): InventoryItem | undefined => {
    let updatedItemResult: InventoryItem | undefined = undefined;
    let oldQuantityValue: number | undefined = undefined;

    setItems(prevItems => {
      const itemIndex = prevItems.findIndex(item => item.id === id);
      if (itemIndex === -1) {
        toast({ title: "Error de Actualización", description: `Artículo con ID ${id} no encontrado.`, variant: "destructive" });
        return prevItems;
      }
      
      const itemToUpdate = prevItems[itemIndex];
      oldQuantityValue = itemToUpdate.quantity;

      updatedItemResult = {
        ...itemToUpdate,
        name: updatedData.name,
        description: updatedData.description || '',
        quantity: Number(updatedData.quantity),
        price: updatedData.price !== undefined && updatedData.price !== '' ? Number(updatedData.price) : undefined,
        category: updatedData.category || '',
        lastUpdated: new Date().toISOString(),
        lowStockThreshold: updatedData.lowStockThreshold !== undefined && updatedData.lowStockThreshold !== '' ? Number(updatedData.lowStockThreshold) : undefined,
      };

      const newItems = [...prevItems];
      newItems[itemIndex] = updatedItemResult;
      return newItems.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
    });

    if (updatedItemResult && oldQuantityValue !== undefined) {
      const currentItem = updatedItemResult; // Use the state from after setItems has scheduled its update
      const newQuantityValue = currentItem.quantity;
      const quantityDifference = newQuantityValue - oldQuantityValue;

      if (quantityDifference > 0) {
        addMovement(id, currentItem.name, 'entrada', quantityDifference, 'Compra de producto');
      } else if (quantityDifference < 0) {
        addMovement(id, currentItem.name, 'salida', Math.abs(quantityDifference), 'Venta de producto');
      }
      checkAndNotifyLowStock(currentItem, oldQuantityValue);
    }
    return updatedItemResult;
  }, [addMovement, checkAndNotifyLowStock, toast]);


  const deleteItem = useCallback((id: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  }, []);

  const getItemById = useCallback((id: string): InventoryItem | undefined => {
    if (!isInitialized) return undefined;
    return items.find((item) => item.id === id);
  }, [items, isInitialized]);

  const getMovementsByItemId = useCallback((itemId: string): InventoryMovement[] => {
    if (!isInitialized) return [];
    return movements.filter(movement => movement.itemId === itemId)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [movements, isInitialized]);

  return {
    items,
    movements,
    isInitialized,
    addItem,
    updateItem,
    deleteItem,
    getItemById,
    getMovementsByItemId,
  };
}
