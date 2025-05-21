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
import { useEffect } from 'react';

interface ItemFormProps {
  item?: InventoryItem; // For editing
}

export function ItemForm({ item }: ItemFormProps) {
  const router = useRouter();
  const { addItem, updateItem } = useInventory();
  const { toast } = useToast();

  const form = useForm<InventoryItemFormValues>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: item 
      ? { name: item.name, description: item.description, quantity: item.quantity, category: item.category }
      : { name: '', description: '', quantity: 0, category: '' },
  });

  useEffect(() => {
    if (item) {
      form.reset({
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        category: item.category,
      });
    }
  }, [item, form]);


  const onSubmit: SubmitHandler<InventoryItemFormValues> = (data) => {
    try {
      if (item) {
        updateItem(item.id, data);
        toast({ title: "Artículo Actualizado", description: `El artículo "${data.name}" ha sido actualizado.` });
      } else {
        addItem(data);
        toast({ title: "Artículo Añadido", description: `El artículo "${data.name}" ha sido añadido al inventario.` });
      }
      router.push('/inventario');
      router.refresh(); // Refresh server components on inventory page
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
                  <FormControl>
                    <Textarea placeholder="Ej: Laptop de alto rendimiento para profesionales." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Electrónicos" {...field} />
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
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (item ? 'Guardando Cambios...' : 'Añadiendo Artículo...') : (item ? 'Guardar Cambios' : 'Añadir Artículo')}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
