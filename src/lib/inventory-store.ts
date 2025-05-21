
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
    if (quantityChanged <= 0) return; // Do not log zero or negative quantity changes

    const newMovement: InventoryMovement = {
      id: crypto.randomUUID(),
      itemId,
      itemName,
      type,
      quantityChanged: Math.abs(quantityChanged), // Ensure positive
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
    return newItem;
  }, [addMovement]);

  const updateItem = useCallback((id: string, updatedData: InventoryItemFormValues): InventoryItem | undefined => {
    const itemToUpdate = items.find(item => item.id === id);
    if (!itemToUpdate) {
      console.warn(`Item with id ${id} not found for update.`);
      return undefined;
    }

    const oldQuantityValue = itemToUpdate.quantity;
    const newQuantityValue = Number(updatedData.quantity);

    const updatedItemObject: InventoryItem = {
      ...itemToUpdate,
      name: updatedData.name,
      description: updatedData.description || '',
      quantity: newQuantityValue,
      price: updatedData.price ? Number(updatedData.price) : undefined,
      category: updatedData.category || '',
      lastUpdated: new Date().toISOString(),
      lowStockThreshold: updatedData.lowStockThreshold ? Number(updatedData.lowStockThreshold) : undefined,
    };

    setItems(prevItems => prevItems.map(item => (item.id === id ? updatedItemObject : item)));

    const quantityDifference = newQuantityValue - oldQuantityValue;

    if (quantityDifference > 0) {
      addMovement(updatedItemObject.id, updatedItemObject.name, 'entrada', quantityDifference, 'Ajuste de cantidad (formulario)');
    } else if (quantityDifference < 0) {
      addMovement(updatedItemObject.id, updatedItemObject.name, 'salida', Math.abs(quantityDifference), 'Ajuste de cantidad (formulario)');
    }
    // If quantityDifference is 0, no movement is logged, which is correct.

    return updatedItemObject;
  }, [items, addMovement]);

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
    const itemToUpdate = items.find(item => item.id === id);
    if (!itemToUpdate) {
      console.warn(`Item with id ${id} not found for increment.`);
      return;
    }
    if (amount <= 0) return; // Can only increment by a positive amount

    const newQuantity = itemToUpdate.quantity + amount;
    const updatedItemObject = { ...itemToUpdate, quantity: newQuantity, lastUpdated: new Date().toISOString() };
    
    setItems(prevItems => prevItems.map(item => (item.id === id ? updatedItemObject : item)));
    
    addMovement(id, updatedItemObject.name, 'entrada', amount, reason);
  }, [items, addMovement]);

  const decrementItemQuantity = useCallback((id: string, amount: number = 1, reason: string = 'Ajuste manual (decremento)') => {
    const itemToUpdate = items.find(item => item.id === id);
    if (!itemToUpdate) {
      console.warn(`Item with id ${id} not found for decrement.`);
      return;
    }
    if (amount <= 0) return; // Can only decrement by a positive amount
    
    const actualAmountToDecrement = Math.min(amount, itemToUpdate.quantity); 
    if (actualAmountToDecrement <= 0) return; 

    const newQuantity = itemToUpdate.quantity - actualAmountToDecrement;
    const updatedItemObject = { ...itemToUpdate, quantity: newQuantity, lastUpdated: new Date().toISOString() };

    setItems(prevItems => prevItems.map(item => (item.id === id ? updatedItemObject : item)));

    addMovement(id, updatedItemObject.name, 'salida', actualAmountToDecrement, reason);
  }, [items, addMovement]);

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
