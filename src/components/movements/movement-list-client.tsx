
"use client";

import type { InventoryMovement, InventoryItem } from '@/types/inventory';
import { useInventory } from '@/lib/inventory-store';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowDownToLine, ArrowUpFromLine, Search, Filter, ArrowUpDown, History, Package } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type SortKey = keyof InventoryMovement | 'itemName' | '';
type SortDirection = 'asc' | 'desc';

const ALL_MOVEMENT_TYPES = "all_qmd_movement_types";

export function MovementListClient() {
  const { movements, items, isInitialized } = useInventory();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>(ALL_MOVEMENT_TYPES);
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const filteredAndSortedMovements = useMemo(() => {
    if (!isInitialized) return [];
    let processedMovements = [...movements];

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      processedMovements = processedMovements.filter(movement =>
        movement.itemName.toLowerCase().includes(lowerSearchTerm) ||
        movement.reason.toLowerCase().includes(lowerSearchTerm)
      );
    }

    if (typeFilter && typeFilter !== ALL_MOVEMENT_TYPES) {
      processedMovements = processedMovements.filter(movement => movement.type === typeFilter);
    }

    if (sortKey) {
      processedMovements.sort((a, b) => {
        let valA = a[sortKey as keyof InventoryMovement];
        let valB = b[sortKey as keyof InventoryMovement];
        
        let comparison = 0;
        if (sortKey === 'date') {
          comparison = new Date(valA as string).getTime() - new Date(valB as string).getTime();
        } else if (typeof valA === 'string' && typeof valB === 'string') {
          comparison = valA.localeCompare(valB);
        } else if (typeof valA === 'number' && typeof valB === 'number') {
          comparison = valA - valB;
        }
        // For quantityChanged, it's always positive, type determines if + or -
        // The actual value is fine for sorting magnitude.

        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    return processedMovements;
  }, [movements, searchTerm, typeFilter, sortKey, sortDirection, isInitialized]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc'); // Default to asc for new sort key, except for date
      if (key === 'date') setSortDirection('desc');
    }
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    return sortDirection === 'asc' ? 
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 h-4 w-4"><path d="m18 15-6-6-6 6"/></svg> :
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 h-4 w-4"><path d="m6 9 6 6 6-6"/></svg>;
  };
  
  const doesItemExist = (itemId: string): boolean => {
    return items.some(item => item.id === itemId);
  };

  if (!isInitialized) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4 gap-4">
            <Skeleton className="h-10 w-1/2 sm:w-1/3" />
            <Skeleton className="h-10 w-[180px]" />
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-4 border-b">
              <Skeleton className="h-6 w-1/5" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-6 w-1/6" />
              <Skeleton className="h-6 w-1/6" />
              <Skeleton className="h-6 w-1/5" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardContent className="p-0 md:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 p-4 md:p-0 border-b md:border-none">
          <div className="relative w-full sm:w-auto sm:flex-grow max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por artículo o razón..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_MOVEMENT_TYPES}>Todos los Tipos</SelectItem>
              <SelectItem value="entrada">Entrada</SelectItem>
              <SelectItem value="salida">Salida</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredAndSortedMovements.length === 0 && (searchTerm || typeFilter !== ALL_MOVEMENT_TYPES) && (
          <div className="text-center py-10 text-muted-foreground">
            <p>No se encontraron movimientos que coincidan con tu búsqueda o filtro.</p>
          </div>
        )}
        {filteredAndSortedMovements.length === 0 && !searchTerm && typeFilter === ALL_MOVEMENT_TYPES && (
          <div className="text-center py-10">
            <History className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Sin Movimientos Registrados</h3>
            <p className="text-muted-foreground">Aún no se ha registrado ninguna entrada o salida de inventario.</p>
          </div>
        )}

        {filteredAndSortedMovements.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer hover:bg-muted/50 min-w-[170px]" onClick={() => handleSort('date')}>
                    <div className="flex items-center">Fecha {renderSortIcon('date')}</div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50 min-w-[150px]" onClick={() => handleSort('itemName')}>
                    <div className="flex items-center">Artículo {renderSortIcon('itemName')}</div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50 min-w-[120px]" onClick={() => handleSort('type')}>
                    <div className="flex items-center">Tipo {renderSortIcon('type')}</div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50 min-w-[100px] text-right" onClick={() => handleSort('quantityChanged')}>
                    <div className="flex items-center justify-end">Cantidad {renderSortIcon('quantityChanged')}</div>
                  </TableHead>
                  <TableHead className="min-w-[200px]">Razón</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedMovements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>
                      {new Date(movement.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {' '}
                      {new Date(movement.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell className="font-medium">
                      {doesItemExist(movement.itemId) ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link href={`/inventario/editar/${movement.itemId}`} className="hover:underline text-primary">
                                {movement.itemName}
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Ver/Editar artículo: {movement.itemName}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-muted-foreground" title="Este artículo ha sido eliminado">{movement.itemName} (Eliminado)</span>
                      )}
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
                    <TableCell className="max-w-xs truncate" title={movement.reason}>{movement.reason || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
