
"use client";

import type { InventoryItem, InventoryItemFormValues, InventoryMovement, InventoryMovementType } from '@/types/inventory';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";

const INVENTORY_STORAGE_KEY = 'qmdInventoryAppItems';
const INVENTORY_MOVEMENTS_STORAGE_KEY = 'qmdInventoryAppMovements';

const getStoredItems = (): InventoryItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(INVENTORY_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error parsing inventory from localStorage:", error);
    return [];
  }
};

const setStoredItems = (items: InventoryItem[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Error saving inventory to localStorage:", error);
  }
};

const getStoredMovements = (): InventoryMovement[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(INVENTORY_MOVEMENTS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error parsing movements from localStorage:", error);
    return [];
  }
};

const setStoredMovements = (movements: InventoryMovement[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(INVENTORY_MOVEMENTS_STORAGE_KEY, JSON.stringify(movements));
  } catch (error) {
    console.error("Error saving movements to localStorage:", error);
  }
};

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setItems(getStoredItems());
    setMovements(getStoredMovements());
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      setStoredItems(items);
    }
  }, [items, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      setStoredMovements(movements);
    }
  }, [movements, isInitialized]);

  const checkAndNotifyLowStock = useCallback((item: InventoryItem, oldQuantity?: number) => {
    if (item.lowStockThreshold !== undefined && item.quantity < item.lowStockThreshold) {
      // Notify if it just crossed the threshold or is a new item already low
      const justCrossedThreshold = oldQuantity !== undefined && oldQuantity >= item.lowStockThreshold;
      const isNewAndLow = oldQuantity === undefined; // For newly added items

      if (justCrossedThreshold || isNewAndLow) {
        toast({
          title: "Alerta de Stock Bajo",
          description: `El artículo "${item.name}" solo tiene ${item.quantity} unidades. (Umbral: ${item.lowStockThreshold})`,
          variant: "default", // Could be 'destructive' or a new 'warning' variant if desired
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
      id: crypto.randomUUID(),
      itemId,
      itemName,
      type,
      quantityChanged: Math.abs(quantityChanged),
      reason,
      date: new Date().toISOString(),
    };
    setMovements((prevMovements) => [newMovement, ...prevMovements]);
  }, []);

  const addItem = useCallback((itemData: InventoryItemFormValues): InventoryItem => {
    const newItem: InventoryItem = {
      id: crypto.randomUUID(),
      name: itemData.name,
      description: itemData.description || '',
      quantity: Number(itemData.quantity),
      price: itemData.price ? Number(itemData.price) : undefined,
      category: itemData.category || '',
      dateAdded: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      lowStockThreshold: itemData.lowStockThreshold ? Number(itemData.lowStockThreshold) : undefined,
    };
    setItems((prevItems) => [...prevItems, newItem]);
    if (Number(itemData.quantity) > 0) {
      addMovement(newItem.id, newItem.name, 'entrada', Number(itemData.quantity), 'Alta inicial de artículo');
    }
    checkAndNotifyLowStock(newItem); // Check for low stock on new item
    return newItem;
  }, [addMovement, checkAndNotifyLowStock]);

  const updateItem = useCallback((id: string, updatedData: InventoryItemFormValues): InventoryItem | undefined => {
    let updatedItemObject: InventoryItem | undefined;
    let oldQuantityValue: number | undefined;

    setItems(prevItems => {
      const itemToUpdate = prevItems.find(item => item.id === id);
      if (!itemToUpdate) {
        console.warn(`Item with id ${id} not found for update.`);
        return prevItems;
      }
      oldQuantityValue = itemToUpdate.quantity; // Capture old quantity before update

      updatedItemObject = {
        ...itemToUpdate,
        name: updatedData.name,
        description: updatedData.description || '',
        quantity: Number(updatedData.quantity),
        price: updatedData.price ? Number(updatedData.price) : undefined,
        category: updatedData.category || '',
        lastUpdated: new Date().toISOString(),
        lowStockThreshold: updatedData.lowStockThreshold ? Number(updatedData.lowStockThreshold) : undefined,
      };

      return prevItems.map(item => (item.id === id ? updatedItemObject! : item));
    });

    if (updatedItemObject && oldQuantityValue !== undefined) {
      const newQuantityValue = updatedItemObject.quantity;
      const quantityDifference = newQuantityValue - oldQuantityValue;

      if (quantityDifference > 0) {
        addMovement(updatedItemObject.id, updatedItemObject.name, 'entrada', quantityDifference, 'Compra de producto');
      } else if (quantityDifference < 0) {
        addMovement(updatedItemObject.id, updatedItemObject.name, 'salida', Math.abs(quantityDifference), 'Venta de producto');
      }
      checkAndNotifyLowStock(updatedItemObject, oldQuantityValue);
    }
    return updatedItemObject;
  }, [addMovement, checkAndNotifyLowStock]);

  const deleteItem = useCallback((id: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  }, []);

  const getItemById = useCallback((id: string): InventoryItem | undefined => {
    if (!isInitialized) return undefined;
    return items.find((item) => item.id === id);
  }, [items, isInitialized]);

  const getMovementsByItemId = useCallback((itemId: string): InventoryMovement[] => {
    if (!isInitialized) return [];
    return movements.filter(movement => movement.itemId === itemId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [movements, isInitialized]);

  const incrementItemQuantity = useCallback((id: string, amount: number = 1, reason: string = 'Ajuste manual (incremento)') => {
    let updatedItemObject: InventoryItem | undefined;
    let oldQuantityValue: number | undefined;

    setItems(prevItems => {
        const itemToUpdate = prevItems.find(item => item.id === id);
        if (!itemToUpdate) {
          console.warn(`Item with id ${id} not found for increment.`);
          return prevItems;
        }
        if (amount <= 0) return prevItems;
        oldQuantityValue = itemToUpdate.quantity;
        const newQuantity = itemToUpdate.quantity + amount;
        updatedItemObject = { ...itemToUpdate, quantity: newQuantity, lastUpdated: new Date().toISOString() };
        return prevItems.map(item => (item.id === id ? updatedItemObject! : item));
    });
    
    if (updatedItemObject && oldQuantityValue !== undefined) {
        addMovement(id, updatedItemObject.name, 'entrada', amount, reason);
        checkAndNotifyLowStock(updatedItemObject, oldQuantityValue);
    }
  }, [addMovement, checkAndNotifyLowStock]);

  const decrementItemQuantity = useCallback((id: string, amount: number = 1, reason: string = 'Ajuste manual (decremento)') => {
    let updatedItemObject: InventoryItem | undefined;
    let oldQuantityValue: number | undefined;

    setItems(prevItems => {
        const itemToUpdate = prevItems.find(item => item.id === id);
        if (!itemToUpdate) {
          console.warn(`Item with id ${id} not found for decrement.`);
          return prevItems;
        }
        if (amount <= 0) return prevItems;
        
        oldQuantityValue = itemToUpdate.quantity;
        const actualAmountToDecrement = Math.min(amount, itemToUpdate.quantity); 
        if (actualAmountToDecrement <= 0) return prevItems;

        const newQuantity = itemToUpdate.quantity - actualAmountToDecrement;
        updatedItemObject = { ...itemToUpdate, quantity: newQuantity, lastUpdated: new Date().toISOString() };
        return prevItems.map(item => (item.id === id ? updatedItemObject! : item));
    });

    if (updatedItemObject && oldQuantityValue !== undefined) {
        const actualAmountToDecrement = oldQuantityValue - updatedItemObject.quantity;
         if (actualAmountToDecrement > 0) {
            addMovement(id, updatedItemObject.name, 'salida', actualAmountToDecrement, reason);
            checkAndNotifyLowStock(updatedItemObject, oldQuantityValue);
        }
    }
  }, [addMovement, checkAndNotifyLowStock]);

  return {
    items: isInitialized ? items : [],
    movements: isInitialized ? movements : [],
    isInitialized,
    addItem,
    updateItem,
    deleteItem,
    getItemById,
    getMovementsByItemId,
    incrementItemQuantity, 
    decrementItemQuantity, 
  };
}

    