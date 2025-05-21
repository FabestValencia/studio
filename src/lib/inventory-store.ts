
import type { InventoryItem, InventoryItemFormValues } from '@/types/inventory';
import { useState, useEffect, useCallback } from 'react';

const INVENTORY_STORAGE_KEY = 'qmdInventoryAppItems';

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
  } catch (error)
  {
    console.error("Error saving inventory to localStorage:", error);
  }
};

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    setItems(getStoredItems());
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      setStoredItems(items);
    }
  }, [items, isInitialized]);

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
    return newItem;
  }, []);

  const updateItem = useCallback((id: string, updatedData: InventoryItemFormValues): InventoryItem | undefined => {
    let resultItem: InventoryItem | undefined;
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === id) {
          resultItem = {
            ...item,
            name: updatedData.name,
            description: updatedData.description || '',
            quantity: Number(updatedData.quantity),
            price: updatedData.price ? Number(updatedData.price) : undefined,
            category: updatedData.category || '',
            lastUpdated: new Date().toISOString(),
            lowStockThreshold: updatedData.lowStockThreshold ? Number(updatedData.lowStockThreshold) : undefined,
          };
          return resultItem;
        }
        return item;
      })
    );
    return resultItem;
  }, []);

  const deleteItem = useCallback((id: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  }, []);

  const getItemById = useCallback((id: string): InventoryItem | undefined => {
    if (!isInitialized) return undefined; 
    return items.find((item) => item.id === id);
  }, [items, isInitialized]);

  const incrementItemQuantity = useCallback((id: string, amount: number = 1) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + amount, lastUpdated: new Date().toISOString() } : item
      )
    );
  }, []);

  const decrementItemQuantity = useCallback((id: string, amount: number = 1) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(0, item.quantity - amount), lastUpdated: new Date().toISOString() } : item
      )
    );
  }, []);

  return {
    items: isInitialized ? items : [],
    isInitialized,
    addItem,
    updateItem,
    deleteItem,
    getItemById,
    incrementItemQuantity,
    decrementItemQuantity,
  };
}
