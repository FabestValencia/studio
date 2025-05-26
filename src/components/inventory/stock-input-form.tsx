
"use client";

import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { stockInputSchema } from '@/lib/zod-schemas';
import type { StockInputFormValues, InventoryItem } from '@/types/inventory';
import { useInventory } from '@/lib/inventory-store';
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from 'react';

export function StockInputForm() {
  const router = useRouter();
  const { items, recordStockInput, isInitialized } = useInventory();
  const { toast } = useToast();
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const form = useForm<StockInputFormValues>({
    resolver: zodResolver(stockInputSchema),
    defaultValues: {
      itemId: '',
      quantity: '',
      reason: '',
    },
  });

  useEffect(() => {
    const itemId = form.watch("itemId");
    if (itemId) {
      const item = items.find(i => i.id === itemId);
      setSelectedItem(item || null);
    } else {
      setSelectedItem(null);
    }
  }, [form.watch("itemId"), items]);

  const onSubmit: SubmitHandler<StockInputFormValues> = (data) => {
    if (!selectedItem) {
      toast({ title: "Error", description: "Por favor, selecciona un artículo.", variant: "destructive" });
      return;
    }
    const quantityToAdd = Number(data.quantity);

    try {
      const success = recordStockInput(data.itemId, quantityToAdd, data.reason);
      if (success) {
        router.push('/inventario');
        router.refresh(); 
      }
    } catch (error) {
      console.error("Error recording stock input:", error);
      toast({ title: "Error", description: "No se pudo registrar la entrada.", variant: "destructive" });
    }
  };
  
  if (!isInitialized) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Cargando Formulario...</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-10 bg-muted rounded animate-pulse"></div>
          <div className="h-10 bg-muted rounded animate-pulse"></div>
          <div className="h-20 bg-muted rounded animate-pulse"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-lg mx-auto shadow-lg">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 pt-6">
            <FormField
              control={form.control}
              name="itemId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Artículo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un artículo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {items.length === 0 && <SelectItem value="no-items" disabled>No hay artículos disponibles</SelectItem>}
                      {items.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} (Actual: {item.quantity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cantidad a Añadir</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Ej: 10" 
                      {...field} 
                      onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                      value={field.value}
                      disabled={!selectedItem}
                    />
                  </FormControl>
                  {selectedItem && <FormDescription>Stock actual del artículo seleccionado: {selectedItem.quantity}</FormDescription>}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Razón de la Entrada</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ej: Compra a proveedor, Devolución, Ajuste de inventario" {...field} />
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
            <Button type="submit" disabled={form.formState.isSubmitting || !selectedItem}>
              {form.formState.isSubmitting ? 'Registrando Entrada...' : 'Registrar Entrada'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
