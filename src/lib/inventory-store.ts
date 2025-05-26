
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
      const justCrossedThreshold = oldQuantity !== undefined && oldQuantity >= item.lowStockThreshold && item.quantity < item.lowStockThreshold;
      const isNewAndLow = oldQuantity === undefined && item.quantity < item.lowStockThreshold; 

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
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9), 
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
    const itemIndex = items.findIndex(item => item.id === id);
    if (itemIndex === -1) {
        toast({ title: "Error de Actualización", description: `Artículo con ID ${id} no encontrado.`, variant: "destructive" });
        return undefined;
    }

    const itemToUpdate = items[itemIndex];
    const oldQuantityValue = itemToUpdate.quantity;

    const updatedItem: InventoryItem = {
      ...itemToUpdate,
      name: updatedData.name,
      description: updatedData.description || '',
      quantity: Number(updatedData.quantity),
      price: updatedData.price !== undefined && updatedData.price !== '' ? Number(updatedData.price) : undefined,
      category: updatedData.category || '',
      lastUpdated: new Date().toISOString(),
      lowStockThreshold: updatedData.lowStockThreshold !== undefined && updatedData.lowStockThreshold !== '' ? Number(updatedData.lowStockThreshold) : undefined,
    };
    
    setItems(prevItems => {
      const newItems = [...prevItems];
      newItems[itemIndex] = updatedItem;
      return newItems.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
    });

    const newQuantityValue = updatedItem.quantity;
    const quantityDifference = newQuantityValue - oldQuantityValue;

    if (quantityDifference > 0) {
      addMovement(id, updatedItem.name, 'entrada', quantityDifference, 'Compra de producto');
    } else if (quantityDifference < 0) {
      addMovement(id, updatedItem.name, 'salida', Math.abs(quantityDifference), 'Venta de producto');
    }
    
    checkAndNotifyLowStock(updatedItem, oldQuantityValue);
    return updatedItem;
  }, [items, addMovement, checkAndNotifyLowStock, toast]);


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

  const recordStockOutput = useCallback((itemId: string, quantityToOutput: number, reason: string): boolean => {
    const itemToUpdate = items.find(item => item.id === itemId);

    if (!itemToUpdate) {
      toast({ title: "Error", description: "Artículo no encontrado.", variant: "destructive" });
      return false;
    }

    if (itemToUpdate.quantity < quantityToOutput) {
      toast({ title: "Error de Stock", description: `No hay suficiente stock de "${itemToUpdate.name}". Disponible: ${itemToUpdate.quantity}.`, variant: "destructive" });
      return false;
    }

    const oldQuantity = itemToUpdate.quantity;
    const updatedItem: InventoryItem = {
      ...itemToUpdate,
      quantity: itemToUpdate.quantity - quantityToOutput,
      lastUpdated: new Date().toISOString(),
    };

    setItems(prevItems =>
      prevItems.map(item => (item.id === itemId ? updatedItem : item))
               .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
    );

    addMovement(itemId, updatedItem.name, 'salida', quantityToOutput, reason);
    checkAndNotifyLowStock(updatedItem, oldQuantity);
    
    toast({ title: "Salida Registrada", description: `Se retiraron ${quantityToOutput} unidades de "${updatedItem.name}".` });
    return true;
  }, [items, addMovement, checkAndNotifyLowStock, toast]);

  const recordStockInput = useCallback((itemId: string, quantityToAdd: number, reason: string): boolean => {
    const itemToUpdate = items.find(item => item.id === itemId);

    if (!itemToUpdate) {
      toast({ title: "Error", description: "Artículo no encontrado.", variant: "destructive" });
      return false;
    }

    const oldQuantity = itemToUpdate.quantity;
    const updatedItem: InventoryItem = {
      ...itemToUpdate,
      quantity: itemToUpdate.quantity + quantityToAdd,
      lastUpdated: new Date().toISOString(),
    };

    setItems(prevItems =>
      prevItems.map(item => (item.id === itemId ? updatedItem : item))
               .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
    );

    addMovement(itemId, updatedItem.name, 'entrada', quantityToAdd, reason);
    // For stock input, we don't typically check for low stock immediately,
    // but we might want to clear a previous low stock warning if applicable,
    // however, checkAndNotifyLowStock only notifies if it *is* low.
    checkAndNotifyLowStock(updatedItem, oldQuantity); 
    
    toast({ title: "Entrada Registrada", description: `Se añadieron ${quantityToAdd} unidades a "${updatedItem.name}".` });
    return true;
  }, [items, addMovement, checkAndNotifyLowStock, toast]);


  return {
    items,
    movements,
    isInitialized,
    addItem,
    updateItem,
    deleteItem,
    getItemById,
    getMovementsByItemId,
    recordStockOutput,
    recordStockInput,
  };
}
