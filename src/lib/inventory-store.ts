
import type { InventoryItem, InventoryItemFormValues, InventoryMovement, InventoryMovementType } from '@/types/inventory';
import { useState, useEffect, useCallback } from 'react';

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

  const addMovement = useCallback((
    itemId: string,
    itemName: string,
    type: InventoryMovementType,
    quantityChanged: number,
    reason: string
  ) => {
    const newMovement: InventoryMovement = {
      id: crypto.randomUUID(),
      itemId,
      itemName,
      type,
      quantityChanged: Math.abs(quantityChanged), // Ensure positive
      reason,
      date: new Date().toISOString(),
    };
    setMovements((prevMovements) => [newMovement, ...prevMovements]); // Add to beginning for chronological display (newest first)
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
    return newItem;
  }, [addMovement]);

  const updateItem = useCallback((id: string, updatedData: InventoryItemFormValues): InventoryItem | undefined => {
    let resultItem: InventoryItem | undefined;
    let oldQuantity: number | undefined;

    setItems((prevItems) => {
      const itemToUpdate = prevItems.find(item => item.id === id);
      if (itemToUpdate) {
        oldQuantity = itemToUpdate.quantity;
      }
      return prevItems.map((item) => {
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
      });
    });

    if (resultItem && oldQuantity !== undefined) {
      const quantityDifference = Number(updatedData.quantity) - oldQuantity;
      if (quantityDifference > 0) {
        addMovement(resultItem.id, resultItem.name, 'entrada', quantityDifference, 'Ajuste de cantidad (formulario)');
      } else if (quantityDifference < 0) {
        addMovement(resultItem.id, resultItem.name, 'salida', Math.abs(quantityDifference), 'Ajuste de cantidad (formulario)');
      }
    }
    return resultItem;
  }, [addMovement]);

  const deleteItem = useCallback((id: string) => {
    // Optional: Could also delete movements associated with this item
    // For now, movements will remain for historical record, but will refer to a deleted item's ID.
    // If you want to delete movements:
    // setMovements(prev => prev.filter(m => m.itemId !== id));
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


  // Kept for potential internal use or future reintroduction, will log movements.
  const incrementItemQuantity = useCallback((id: string, amount: number = 1, reason: string = 'Ajuste manual (incremento)') => {
    let itemName = '';
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === id) {
          itemName = item.name;
          return { ...item, quantity: item.quantity + amount, lastUpdated: new Date().toISOString() };
        }
        return item;
      })
    );
    if (itemName) {
      addMovement(id, itemName, 'entrada', amount, reason);
    }
  }, [addMovement]);

  const decrementItemQuantity = useCallback((id: string, amount: number = 1, reason: string = 'Ajuste manual (decremento)') => {
    let itemName = '';
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === id) {
          itemName = item.name;
          return { ...item, quantity: Math.max(0, item.quantity - amount), lastUpdated: new Date().toISOString() };
        }
        return item;
      })
    );
    if (itemName) {
       addMovement(id, itemName, 'salida', amount, reason);
    }
  }, [addMovement]);

  return {
    items: isInitialized ? items : [],
    movements: isInitialized ? movements : [],
    isInitialized,
    addItem,
    updateItem,
    deleteItem,
    getItemById,
    getMovementsByItemId,
    incrementItemQuantity, // Exposing these if needed later
    decrementItemQuantity, // Exposing these if needed later
  };
}
