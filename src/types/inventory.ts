export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  category?: string;
  dateAdded: string; // ISO date string
  lastUpdated: string; // ISO date string
}

export type InventoryItemFormValues = {
  name: string;
  description: string;
  quantity: number | string; // string from form, number in actual data
  category?: string;
};
