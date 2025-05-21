
'use server';
/**
 * @fileOverview Suggests an item price using AI.
 *
 * - suggestItemPrice - A function that handles item price suggestion.
 * - SuggestItemPriceInput - The input type for the flow.
 * - SuggestItemPriceOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestItemPriceInputSchema = z.object({
  itemName: z.string().describe('The name of the item.'),
  itemDescription: z.string().optional().describe('The description of the item (optional).'),
  itemCategory: z.string().optional().describe('The category of the item (optional).'),
});
export type SuggestItemPriceInput = z.infer<typeof SuggestItemPriceInputSchema>;

const SuggestItemPriceOutputSchema = z.object({
  suggestedPrice: z.number().optional().describe('The suggested market price for the item. Provide only a numerical value, e.g., 29.99 or 150. Do not include currency symbols.'),
  reasoning: z.string().optional().describe('A brief explanation for the suggested price (optional).')
});
export type SuggestItemPriceOutput = z.infer<typeof SuggestItemPriceOutputSchema>;

export async function suggestItemPrice(input: SuggestItemPriceInput): Promise<SuggestItemPriceOutput> {
  return suggestItemPriceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestItemPricePrompt',
  input: {schema: SuggestItemPriceInputSchema},
  output: {schema: SuggestItemPriceOutputSchema},
  prompt: `Eres un experto en fijación de precios de mercado y comercio electrónico.
Basándote en el nombre del artículo, su descripción (si se proporciona) y su categoría (si se proporciona), sugiere un precio de venta competitivo en USD.
Considera factores como el tipo de producto, características, posible público objetivo y precios de artículos similares.

Nombre del artículo: {{{itemName}}}
{{#if itemDescription}}
Descripción: {{{itemDescription}}}
{{/if}}
{{#if itemCategory}}
Categoría: {{{itemCategory}}}
{{/if}}

Devuelve solo el precio sugerido como un número (por ejemplo, 29.99 o 150) y, opcionalmente, una breve justificación.
Si no puedes determinar un precio razonable, no devuelvas un precio.
Ejemplo de salida deseada:
{ "suggestedPrice": 49.99, "reasoning": "Basado en productos similares y características premium." }
o si no se puede determinar:
{ "reasoning": "No hay suficiente información para determinar un precio." }
`,
  // Lowering temperature for more deterministic pricing, though market prices can vary.
  config: {
    temperature: 0.3,
  }
});

const suggestItemPriceFlow = ai.defineFlow(
  {
    name: 'suggestItemPriceFlow',
    inputSchema: SuggestItemPriceInputSchema,
    outputSchema: SuggestItemPriceOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('La IA no pudo sugerir un precio.');
    }
    // Ensure suggestedPrice is a number if present
    if (output.suggestedPrice !== undefined && typeof output.suggestedPrice !== 'number') {
        const parsedPrice = parseFloat(String(output.suggestedPrice));
        if (!isNaN(parsedPrice)) {
            output.suggestedPrice = parsedPrice;
        } else {
            // If parsing fails, remove it or set to undefined, as per schema.
            // Here, we'll prefer to remove it if it's not a valid number.
            output.suggestedPrice = undefined; 
            if (!output.reasoning) {
                output.reasoning = "La IA devolvió un formato de precio inesperado.";
            }
        }
    }
    return output;
  }
);
