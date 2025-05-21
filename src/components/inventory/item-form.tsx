"use client";

import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { inventoryItemSchema } from '@/lib/zod-schemas';
import type { InventoryItem, InventoryItemFormValues } from '@/types/inventory';
import { useInventory } from '@/lib/inventory-store';
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from 'react';
import { Sparkles, Lightbulb } from 'lucide-react';
import { generateItemDescription } from '@/ai/flows/generate-item-description-flow';
import { suggestItemCategory } from '@/ai/flows/suggest-item-category-flow';

interface ItemFormProps {
  item?: InventoryItem; // For editing
}

export function ItemForm({ item }: ItemFormProps) {
  const router = useRouter();
  const { addItem, updateItem } = useInventory();
  const { toast } = useToast();
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isSuggestingCategory, setIsSuggestingCategory] = useState(false);

  const form = useForm<InventoryItemFormValues>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: item 
      ? { 
          name: item.name, 
          description: item.description, 
          quantity: item.quantity, 
          category: item.category,
          imageUrl: item.imageUrl,
          lowStockThreshold: item.lowStockThreshold 
        }
      : { 
          name: '', 
          description: '', 
          quantity: 0, 
          category: '',
          imageUrl: '',
          lowStockThreshold: 0
        },
  });

  useEffect(() => {
    if (item) {
      form.reset({
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        category: item.category,
        imageUrl: item.imageUrl,
        lowStockThreshold: item.lowStockThreshold,
      });
    }
  }, [item, form]);

  const handleGenerateDescription = async () => {
    const itemName = form.getValues("name");
    const itemCategory = form.getValues("category");
    if (!itemName) {
      toast({ title: "Nombre Requerido", description: "Por favor, introduce un nombre para el artículo antes de generar una descripción.", variant: "destructive" });
      return;
    }
    setIsGeneratingDescription(true);
    try {
      const result = await generateItemDescription({ itemName, itemCategory: itemCategory || '' });
      form.setValue("description", result.description);
      toast({ title: "Descripción Generada", description: "Se ha generado una descripción para el artículo." });
    } catch (error) {
      console.error("Error generating description:", error);
      toast({ title: "Error de IA", description: "No se pudo generar la descripción.", variant: "destructive" });
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleSuggestCategory = async () => {
    const itemName = form.getValues("name");
    const itemDescription = form.getValues("description");
    if (!itemName) {
      toast({ title: "Nombre Requerido", description: "Por favor, introduce un nombre para el artículo antes de sugerir una categoría.", variant: "destructive" });
      return;
    }
    setIsSuggestingCategory(true);
    try {
      const result = await suggestItemCategory({ itemName, itemDescription: itemDescription || '' });
      form.setValue("category", result.suggestedCategory);
      toast({ title: "Categoría Sugerida", description: `Se ha sugerido la categoría: ${result.suggestedCategory}` });
    } catch (error) {
      console.error("Error suggesting category:", error);
      toast({ title: "Error de IA", description: "No se pudo sugerir la categoría.", variant: "destructive" });
    } finally {
      setIsSuggestingCategory(false);
    }
  };

  const onSubmit: SubmitHandler<InventoryItemFormValues> = (data) => {
    try {
      const submittedData = {
        ...data,
        quantity: Number(data.quantity),
        lowStockThreshold: data.lowStockThreshold ? Number(data.lowStockThreshold) : undefined
      };

      if (item) {
        updateItem(item.id, submittedData);
        toast({ title: "Artículo Actualizado", description: `El artículo "${data.name}" ha sido actualizado.` });
      } else {
        addItem(submittedData);
        toast({ title: "Artículo Añadido", description: `El artículo "${data.name}" ha sido añadido al inventario.` });
      }
      router.push('/inventario');
      router.refresh();
    } catch (error) {
      console.error("Error saving item:", error);
      toast({ title: "Error", description: "No se pudo guardar el artículo.", variant: "destructive" });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle>{item ? 'Editar Artículo' : 'Añadir Nuevo Artículo'}</CardTitle>
        <CardDescription>
          {item ? 'Modifica los detalles del artículo.' : 'Completa el formulario para añadir un nuevo artículo al inventario.'}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Artículo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Laptop Pro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (Opcional)</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Textarea placeholder="Ej: Laptop de alto rendimiento para profesionales." {...field} className="pr-12"/>
                    </FormControl>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={handleGenerateDescription}
                      disabled={isGeneratingDescription || !form.watch("name")}
                      title="Generar descripción con IA"
                    >
                      <Sparkles className={`h-4 w-4 ${isGeneratingDescription ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ej: 10" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lowStockThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Umbral Stock Bajo (Opc.)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ej: 5" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10) || 0)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría (Opcional)</FormLabel>
                   <div className="relative">
                    <FormControl>
                      <Input placeholder="Ej: Electrónicos" {...field} className="pr-12" />
                    </FormControl>
                     <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={handleSuggestCategory}
                      disabled={isSuggestingCategory || !form.watch("name")}
                      title="Sugerir categoría con IA"
                    >
                      <Lightbulb className={`h-4 w-4 ${isSuggestingCategory ? 'animate-pulse' : ''}`} />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL de Imagen (Opcional)</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://ejemplo.com/imagen.png" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.push('/inventario')}>
              Cancelar
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting || isGeneratingDescription || isSuggestingCategory}>
              {form.formState.isSubmitting ? (item ? 'Guardando Cambios...' : 'Añadiendo Artículo...') : (item ? 'Guardar Cambios' : 'Añadir Artículo')}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
