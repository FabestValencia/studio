
"use client";

import type { InventoryMovement } from "@/types/inventory";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowDownToLine, ArrowUpFromLine, History } from "lucide-react";

interface ItemMovementsListProps {
  movements: InventoryMovement[];
}

export function ItemMovementsList({ movements }: ItemMovementsListProps) {
  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
          <History className="h-6 w-6 mr-2 text-muted-foreground" />
          Historial de Movimientos del Artículo
        </CardTitle>
        <CardDescription>
          Un registro de todas las entradas y salidas para este artículo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {movements.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead>Razón</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>
                      {new Date(movement.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {' '}
                      {new Date(movement.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={movement.type === 'entrada' ? 'default' : 'destructive'} className="capitalize">
                        {movement.type === 'entrada' ? 
                          <ArrowDownToLine className="h-3.5 w-3.5 mr-1.5" /> : 
                          <ArrowUpFromLine className="h-3.5 w-3.5 mr-1.5" />
                        }
                        {movement.type}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-medium ${movement.type === 'entrada' ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                      {movement.type === 'entrada' ? '+' : '-'}{movement.quantityChanged}
                    </TableCell>
                    <TableCell>{movement.reason}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay movimientos registrados para este artículo.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
