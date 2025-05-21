
export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  price?: number; // Added for future functionality
  category?: string;
  dateAdded: string; // ISO date string
  lastUpdated: string; // ISO date string
  lowStockThreshold?: number;
}

export type InventoryItemFormValues = {
  name: string;
  description: string;
  quantity: number | string; // string from form, number in actual data
  price?: number | string; // Added for future functionality
  category?: string;
  lowStockThreshold?: number | string; // string from form, number in actual data
};
