export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  category?: string;
  dateAdded: string; // ISO date string
  lastUpdated: string; // ISO date string
  imageUrl?: string;
  lowStockThreshold?: number;
}

export type InventoryItemFormValues = {
  name: string;
  description: string;
  quantity: number | string; // string from form, number in actual data
  category?: string;
  imageUrl?: string;
  lowStockThreshold?: number | string; // string from form, number in actual data
};
