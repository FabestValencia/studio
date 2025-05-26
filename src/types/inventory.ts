
export type InventoryMovementType = 'entrada' | 'salida';

export interface InventoryMovement {
  id: string;
  itemId: string;
  itemName: string; // To display even if item is deleted later
  type: InventoryMovementType;
  quantityChanged: number; // Always positive, type determines direction
  reason: string;
  date: string; // ISO date string
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  price?: number;
  category?: string;
  dateAdded: string; // ISO date string
  lastUpdated: string; // ISO date string
  lowStockThreshold?: number;
}

export type InventoryItemFormValues = {
  name: string;
  description: string;
  quantity: number | string; // string from form, number in actual data
  price?: number | string;
  category?: string;
  lowStockThreshold?: number | string; // string from form, number in actual data
};

export type StockOutputFormValues = {
  itemId: string;
  quantity: number | string;
  reason: string;
};
