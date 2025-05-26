
"use client";

import type { InventoryItem, InventoryItemFormValues, InventoryMovement, InventoryMovementType } from '@/types/inventory';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { db } from './firebase'; // Import Firestore instance
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  writeBatch,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

// Helper to convert Firestore Timestamps to ISO strings
const convertTimestampsToISO = (data: any): any => {
  const result: any = { ...data };
  for (const key in result) {
    if (result[key] instanceof Timestamp) {
      result[key] = result[key].toDate().toISOString();
    }
  }
  return result;
};


export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  // Subscribe to items collection
  useEffect(() => {
    const itemsCollectionRef = collection(db, 'inventoryItems');
    const q = query(itemsCollectionRef, orderBy('dateAdded', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedItems: InventoryItem[] = [];
      querySnapshot.forEach((doc) => {
        fetchedItems.push({ ...convertTimestampsToISO(doc.data()), id: doc.id } as InventoryItem);
      });
      setItems(fetchedItems);
      if (!isInitialized) setIsInitialized(true); // Set initialized after first successful fetch
    }, (error) => {
      console.error("Error fetching inventory items:", error);
      toast({ title: "Error", description: "No se pudieron cargar los artículos del inventario.", variant: "destructive" });
      if (!isInitialized) setIsInitialized(true); // Still set initialized on error to unblock UI
    });

    return () => unsubscribe();
  }, [isInitialized, toast]);

  // Subscribe to movements collection
  useEffect(() => {
    const movementsCollectionRef = collection(db, 'inventoryMovements');
    const q = query(movementsCollectionRef, orderBy('date', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedMovements: InventoryMovement[] = [];
      querySnapshot.forEach((doc) => {
        fetchedMovements.push({ ...convertTimestampsToISO(doc.data()), id: doc.id } as InventoryMovement);
      });
      setMovements(fetchedMovements);
    }, (error) => {
      console.error("Error fetching inventory movements:", error);
      // toast({ title: "Error", description: "No se pudieron cargar los movimientos.", variant: "destructive" });
      // Optional: Toast for movement errors, can be noisy
    });

    return () => unsubscribe();
  }, [toast]);


  const checkAndNotifyLowStock = useCallback((item: InventoryItem, oldQuantity?: number) => {
    if (item.lowStockThreshold !== undefined && item.quantity < item.lowStockThreshold) {
      const justCrossedThreshold = oldQuantity !== undefined && oldQuantity >= item.lowStockThreshold;
      const isNewAndLow = oldQuantity === undefined;

      if (justCrossedThreshold || isNewAndLow) {
        toast({
          title: "Alerta de Stock Bajo",
          description: `El artículo "${item.name}" solo tiene ${item.quantity} unidades. (Umbral: ${item.lowStockThreshold})`,
          variant: "default",
        });
      }
    }
  }, [toast]);

  const addMovement = useCallback(async (
    itemId: string,
    itemName: string,
    type: InventoryMovementType,
    quantityChanged: number,
    reason: string
  ) => {
    if (quantityChanged <= 0) return;

    const newMovementData = {
      itemId,
      itemName,
      type,
      quantityChanged: Math.abs(quantityChanged),
      reason,
      date: serverTimestamp(), // Use Firestore server timestamp
    };
    try {
      const movementsCollectionRef = collection(db, 'inventoryMovements');
      await addDoc(movementsCollectionRef, newMovementData);
    } catch (error) {
      console.error("Error adding movement to Firestore:", error);
      toast({ title: "Error de Movimiento", description: "No se pudo registrar el movimiento.", variant: "destructive" });
    }
  }, [toast]);

  const addItem = useCallback(async (itemData: InventoryItemFormValues): Promise<InventoryItem | undefined> => {
    const newItemData = {
      name: itemData.name,
      description: itemData.description || '',
      quantity: Number(itemData.quantity),
      price: itemData.price ? Number(itemData.price) : null, // Firestore handles undefined as null or field removal
      category: itemData.category || '',
      dateAdded: serverTimestamp(),
      lastUpdated: serverTimestamp(),
      lowStockThreshold: itemData.lowStockThreshold ? Number(itemData.lowStockThreshold) : null,
    };

    try {
      const itemsCollectionRef = collection(db, 'inventoryItems');
      const docRef = await addDoc(itemsCollectionRef, newItemData);
      
      const addedItem: InventoryItem = {
        ...newItemData,
        id: docRef.id,
        dateAdded: new Date().toISOString(), // Approximate client date for immediate UI
        lastUpdated: new Date().toISOString(), // Approximate client date for immediate UI
        price: newItemData.price === null ? undefined : newItemData.price,
        lowStockThreshold: newItemData.lowStockThreshold === null ? undefined : newItemData.lowStockThreshold,
      };

      if (Number(itemData.quantity) > 0) {
        await addMovement(addedItem.id, addedItem.name, 'entrada', Number(itemData.quantity), 'Alta inicial de artículo');
      }
      checkAndNotifyLowStock(addedItem);
      return addedItem;
    } catch (error) {
      console.error("Error adding item to Firestore:", error);
      toast({ title: "Error al Añadir", description: "No se pudo añadir el artículo.", variant: "destructive" });
      return undefined;
    }
  }, [addMovement, checkAndNotifyLowStock, toast]);

  const updateItem = useCallback(async (id: string, updatedData: InventoryItemFormValues): Promise<InventoryItem | undefined> => {
    const itemToUpdate = items.find(item => item.id === id);
    if (!itemToUpdate) {
      console.warn(`Item with id ${id} not found for update.`);
      toast({ title: "Error de Actualización", description: `Artículo con ID ${id} no encontrado.`, variant: "destructive" });
      return undefined;
    }

    const oldQuantityValue = itemToUpdate.quantity;

    const updatedItemPayload = {
      name: updatedData.name,
      description: updatedData.description || '',
      quantity: Number(updatedData.quantity),
      price: updatedData.price ? Number(updatedData.price) : null,
      category: updatedData.category || '',
      lastUpdated: serverTimestamp(),
      lowStockThreshold: updatedData.lowStockThreshold ? Number(updatedData.lowStockThreshold) : null,
    };

    try {
      const itemDocRef = doc(db, 'inventoryItems', id);
      await updateDoc(itemDocRef, updatedItemPayload);

      const updatedItemForUI: InventoryItem = {
        ...itemToUpdate,
        ...updatedItemPayload,
        lastUpdated: new Date().toISOString(), // Approx for UI
        price: updatedItemPayload.price === null ? undefined : updatedItemPayload.price,
        lowStockThreshold: updatedItemPayload.lowStockThreshold === null ? undefined : updatedItemPayload.lowStockThreshold,
      };
      
      const newQuantityValue = updatedItemForUI.quantity;
      const quantityDifference = newQuantityValue - oldQuantityValue;

      if (quantityDifference > 0) {
        await addMovement(id, updatedItemForUI.name, 'entrada', quantityDifference, 'Compra de producto');
      } else if (quantityDifference < 0) {
        await addMovement(id, updatedItemForUI.name, 'salida', Math.abs(quantityDifference), 'Venta de producto');
      }
      checkAndNotifyLowStock(updatedItemForUI, oldQuantityValue);
      return updatedItemForUI;
    } catch (error) {
      console.error("Error updating item in Firestore:", error);
      toast({ title: "Error al Actualizar", description: "No se pudo actualizar el artículo.", variant: "destructive" });
      return undefined;
    }
  }, [items, addMovement, checkAndNotifyLowStock, toast]);

  const deleteItem = useCallback(async (id: string) => {
    // Note: This only deletes the item. Associated movements remain for historical record.
    // You might want to implement a more complex delete (e.g., soft delete or cascading delete of movements)
    // depending on requirements, which would also involve Firebase Functions for proper atomicity.
    try {
      const itemDocRef = doc(db, 'inventoryItems', id);
      await deleteDoc(itemDocRef);
      // UI update will happen via onSnapshot
    } catch (error) {
      console.error("Error deleting item from Firestore:", error);
      toast({ title: "Error al Eliminar", description: "No se pudo eliminar el artículo.", variant: "destructive" });
    }
  }, [toast]);

  const getItemById = useCallback((id: string): InventoryItem | undefined => {
    if (!isInitialized) return undefined; // Or handle loading state appropriately in components
    return items.find((item) => item.id === id);
  }, [items, isInitialized]);

  const getMovementsByItemId = useCallback((itemId: string): InventoryMovement[] => {
    if (!isInitialized) return [];
    return movements.filter(movement => movement.itemId === itemId)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [movements, isInitialized]);

  // incrementItemQuantity and decrementItemQuantity would need to be adapted similarly
  // using updateDoc and potentially Firestore transactions if atomicity is critical.
  // For now, they are omitted as they are not directly used by the UI after previous changes.
  // If re-enabled, they should call updateItem or directly manipulate Firestore docs.

  return {
    items, // No longer conditional on isInitialized here, components should handle loading state based on isInitialized
    movements,
    isInitialized,
    addItem,
    updateItem,
    deleteItem,
    getItemById,
    getMovementsByItemId,
    // incrementItemQuantity and decrementItemQuantity would go here if re-implemented for Firestore
  };
}
