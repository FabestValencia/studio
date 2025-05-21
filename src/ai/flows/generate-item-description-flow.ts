'use server';
/**
 * @fileOverview Generates an item description using AI.
 *
 * - generateItemDescription - A function that handles item description generation.
 * - GenerateItemDescriptionInput - The input type for the flow.
 * - GenerateItemDescriptionOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateItemDescriptionInputSchema = z.object({
  itemName: z.string().describe('The name of the item.'),
  itemCategory: z.string().optional().describe('The category of the item (optional).'),
});
export type GenerateItemDescriptionInput = z.infer<typeof GenerateItemDescriptionInputSchema>;

const GenerateItemDescriptionOutputSchema = z.object({
  description: z.string().describe('The generated item description.'),
});
export type GenerateItemDescriptionOutput = z.infer<typeof GenerateItemDescriptionOutputSchema>;

export async function generateItemDescription(input: GenerateItemDescriptionInput): Promise<GenerateItemDescriptionOutput> {
  return generateItemDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateItemDescriptionPrompt',
  input: {schema: GenerateItemDescriptionInputSchema},
  output: {schema: GenerateItemDescriptionOutputSchema},
  prompt: `Eres un experto en marketing y redacción publicitaria.
Genera una descripción concisa y atractiva para el siguiente artículo de inventario.
Nombre del artículo: {{{itemName}}}
{{#if itemCategory}}
Categoría: {{{itemCategory}}}
{{/if}}
La descripción debe ser breve (1-2 frases), destacar sus características o usos principales y ser adecuada para una lista de inventario o catálogo.
Evita frases como "Este artículo es..." o "Se trata de...". Ve directo al grano.
Ejemplo:
Si el nombre es "Martillo de Garra Ergonómico" y categoría "Herramientas", una buena descripción sería: "Martillo de garra con mango ergonómico antideslizante, perfecto para trabajos de carpintería y bricolaje. Extracción de clavos eficiente."
`,
});

const generateItemDescriptionFlow = ai.defineFlow(
  {
    name: 'generateItemDescriptionFlow',
    inputSchema: GenerateItemDescriptionInputSchema,
    outputSchema: GenerateItemDescriptionOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('La IA no pudo generar una descripción.');
    }
    return output;
  }
);
