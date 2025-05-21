
import { z } from 'zod';

export const inventoryItemSchema = z.object({
  name: z.string().min(1, { message: "El nombre es obligatorio." }).max(100, { message: "El nombre no puede exceder los 100 caracteres." }),
  description: z.string().max(500, { message: "La descripción no puede exceder los 500 caracteres." }).optional().or(z.literal('')),
  quantity: z.coerce.number().int({ message: "La cantidad debe ser un número entero." }).min(0, { message: "La cantidad no puede ser negativa." }),
  price: z.coerce.number().min(0, { message: "El precio no puede ser negativo." }).optional(),
  category: z.string().max(50, { message: "La categoría no puede exceder los 50 caracteres." }).optional().or(z.literal('')),
  lowStockThreshold: z.coerce.number().int({ message: "El umbral debe ser un número entero." }).min(0, { message: "El umbral no puede ser negativo." }).optional(),
});
