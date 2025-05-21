'use server';
/**
 * @fileOverview Suggests an item category using AI.
 *
 * - suggestItemCategory - A function that handles item category suggestion.
 * - SuggestItemCategoryInput - The input type for the flow.
 * - SuggestItemCategoryOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestItemCategoryInputSchema = z.object({
  itemName: z.string().describe('The name of the item.'),
  itemDescription: z.string().optional().describe('The description of the item (optional).'),
});
export type SuggestItemCategoryInput = z.infer<typeof SuggestItemCategoryInputSchema>;

const SuggestItemCategoryOutputSchema = z.object({
  suggestedCategory: z.string().describe('The suggested item category.'),
});
export type SuggestItemCategoryOutput = z.infer<typeof SuggestItemCategoryOutputSchema>;

export async function suggestItemCategory(input: SuggestItemCategoryInput): Promise<SuggestItemCategoryOutput> {
  return suggestItemCategoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestItemCategoryPrompt',
  input: {schema: SuggestItemCategoryInputSchema},
  output: {schema: SuggestItemCategoryOutputSchema},
  prompt: `Eres un experto en organización de inventarios.
Basándote en el nombre y la descripción (si se proporciona) de un artículo, sugiere una categoría única y concisa para él.
La categoría debe ser breve, preferiblemente una o dos palabras.
Nombre del artículo: {{{itemName}}}
{{#if itemDescription}}
Descripción: {{{itemDescription}}}
{{/if}}
Ejemplos:
- Nombre: "Laptop Gamer Pro X1", Descripción: "Laptop de alto rendimiento para gaming con tarjeta gráfica RTX 4090." -> Categoría sugerida: "Electrónicos" o "Portátiles"
- Nombre: "Martillo de Carpintero", Descripción: "Martillo con cabeza de acero y mango de madera." -> Categoría sugerida: "Herramientas"
- Nombre: "Camiseta de Algodón Orgánico", Descripción: "Camiseta suave y cómoda hecha 100% de algodón orgánico." -> Categoría sugerida: "Ropa"

Devuelve solo la categoría sugerida.
`,
});

const suggestItemCategoryFlow = ai.defineFlow(
  {
    name: 'suggestItemCategoryFlow',
    inputSchema: SuggestItemCategoryInputSchema,
    outputSchema: SuggestItemCategoryOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
     if (!output) {
      throw new Error('La IA no pudo sugerir una categoría.');
    }
    return output;
  }
);
