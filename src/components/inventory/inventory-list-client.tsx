
"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useInventory } from '@/lib/inventory-store';
import type { InventoryItem } from '@/types/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { Edit3, Trash2, MoreHorizontal, Search, ArrowUpDown, Filter, PackagePlus, AlertTriangleIcon, Download } from 'lucide-react';
import { DeleteItemDialog } from './delete-item-dialog';
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


type SortKey = keyof InventoryItem | 'price' | '';
type SortDirection = 'asc' | 'desc';

const ALL_CATEGORIES_VALUE = "all_qmd_categories_filter_value";

export function InventoryListClient() {
  const { items, deleteItem, isInitialized } = useInventory();
  const router = useRouter();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL_CATEGORIES_VALUE);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

  const uniqueCategories = useMemo(() => {
    if (!isInitialized) return [];
    const categories = new Set(items.map(item => item.category).filter(Boolean) as string[]);
    return Array.from(categories).sort((a, b) => a.localeCompare(b));
  }, [items, isInitialized]);

  const filteredAndSortedItems = useMemo(() => {
    if (!isInitialized) return [];
    let processedItems = [...items];

    if (searchTerm) {
      processedItems = processedItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (categoryFilter && categoryFilter !== ALL_CATEGORIES_VALUE) {
      processedItems = processedItems.filter(item => item.category === categoryFilter);
    }

    if (sortKey) {
      processedItems.sort((a, b) => {
        let valA = a[sortKey as keyof InventoryItem];
        let valB = b[sortKey as keyof InventoryItem];

        // Handle undefined price for sorting
        if (sortKey === 'price') {
            valA = a.price === undefined ? (sortDirection === 'asc' ? Infinity : -Infinity) : a.price;
            valB = b.price === undefined ? (sortDirection === 'asc' ? Infinity : -Infinity) : b.price;
        }


        let comparison = 0;
        if (typeof valA === 'string' && typeof valB === 'string') {
          comparison = valA.localeCompare(valB);
        } else if (typeof valA === 'number' && typeof valB === 'number') {
          comparison = valA - valB;
        } else if (typeof valA === 'boolean' && typeof valB === 'boolean') {
          comparison = valA === valB ? 0 : (valA ? -1 : 1);
        } else if (sortKey === 'dateAdded' || sortKey === 'lastUpdated') {
           comparison = new Date(valA as string).getTime() - new Date(valB as string).getTime();
        } else if (valA === undefined && valB !== undefined) {
          comparison = sortDirection === 'asc' ? 1 : -1; 
        } else if (valA !== undefined && valB === undefined) {
          comparison = sortDirection === 'asc' ? -1 : 1;
        }
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    return processedItems;
  }, [items, searchTerm, categoryFilter, sortKey, sortDirection, isInitialized]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const handleDelete = (item: InventoryItem) => {
    setItemToDelete(item);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteItem(itemToDelete.id);
      toast({ title: "Artículo Eliminado", description: `El artículo "${itemToDelete.name}" ha sido eliminado.` });
      setItemToDelete(null);
    }
  };

  const handleExportToCSV = () => {
    if (filteredAndSortedItems.length === 0) {
      toast({ title: "No hay datos para exportar", variant: "destructive" });
      return;
    }

    const headers = [
      "ID", "Nombre", "Descripción", "Cantidad", "Precio", 
      "Categoría", "Fecha de Alta", "Última Actualización", "Umbral Stock Bajo"
    ];
    const csvRows = [headers.join(",")];

    filteredAndSortedItems.forEach(item => {
      const row = [
        item.id,
        `"${item.name.replace(/"/g, '""')}"`, // Escape double quotes
        `"${(item.description || '').replace(/"/g, '""')}"`,
        item.quantity,
        item.price !== undefined ? item.price.toFixed(2) : '',
        `"${(item.category || '').replace(/"/g, '""')}"`,
        new Date(item.dateAdded).toLocaleString('es-ES'),
        new Date(item.lastUpdated).toLocaleString('es-ES'),
        item.lowStockThreshold !== undefined ? item.lowStockThreshold : ''
      ];
      csvRows.push(row.join(","));
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `inventario_qmd_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: "Exportación Exitosa", description: "El inventario ha sido exportado a CSV." });
    } else {
       toast({ title: "Exportación Fallida", description: "Tu navegador no soporta la descarga de archivos.", variant: "destructive" });
    }
  };
  
  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    return sortDirection === 'asc' ? 
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 h-4 w-4"><path d="m18 15-6-6-6 6"/></svg> :
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 h-4 w-4"><path d="m6 9 6 6 6-6"/></svg>;
  };

  if (!isInitialized) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4 gap-4">
            <Skeleton className="h-10 w-1/2 sm:w-1/3" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-[180px]" />
              <Skeleton className="h-10 w-10" />
            </div>
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-4 border-b">
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-6 w-1/6" />
              <Skeleton className="h-6 w-1/6" />
              <Skeleton className="h-8 w-10" />
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
              placeholder="Buscar artículos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Select 
              value={categoryFilter} 
              onValueChange={(value) => setCategoryFilter(value)}
            >
              <SelectTrigger className="w-full sm:w-[240px]"> {/* Increased width from sm:w-[180px] */}
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Filtrar por categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_CATEGORIES_VALUE}>Todas las categorías</SelectItem>
                {uniqueCategories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleExportToCSV} disabled={filteredAndSortedItems.length === 0}>
                    <Download className="h-4 w-4" />
                    <span className="sr-only">Exportar a CSV</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Exportar a CSV</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {filteredAndSortedItems.length === 0 && (searchTerm || (categoryFilter && categoryFilter !== ALL_CATEGORIES_VALUE)) && (
           <div className="text-center py-10 text-muted-foreground">
             <p>No se encontraron artículos que coincidan con tu búsqueda o filtro.</p>
           </div>
        )}
        {filteredAndSortedItems.length === 0 && !searchTerm && (!categoryFilter || categoryFilter === ALL_CATEGORIES_VALUE) && (
           <div className="text-center py-10">
             <h3 className="text-xl font-semibold mb-2">Inventario Vacío</h3>
             <p className="text-muted-foreground mb-4">Aún no has añadido ningún artículo. ¡Empieza añadiendo uno!</p>
             <Link href="/inventario/nuevo">
                <Button>
                    <PackagePlus className="mr-2 h-4 w-4" />
                    Añadir Primer Artículo
                </Button>
             </Link>
           </div>
        )}

        {filteredAndSortedItems.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer hover:bg-muted/50 min-w-[150px]" onClick={() => handleSort('name')}>
                    <div className="flex items-center">Nombre {renderSortIcon('name')}</div>
                  </TableHead>
                  <TableHead className="hidden md:table-cell min-w-[200px]">Descripción</TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50 min-w-[100px] text-center" onClick={() => handleSort('quantity')}>
                     <div className="flex items-center justify-center">Cantidad {renderSortIcon('quantity')}</div>
                  </TableHead>
                   <TableHead className="hidden sm:table-cell cursor-pointer hover:bg-muted/50 min-w-[100px]" onClick={() => handleSort('price')}>
                    <div className="flex items-center">Precio {renderSortIcon('price')}</div>
                  </TableHead>
                  <TableHead className="hidden sm:table-cell cursor-pointer hover:bg-muted/50 min-w-[120px]" onClick={() => handleSort('category')}>
                    <div className="flex items-center">Categoría {renderSortIcon('category')}</div>
                  </TableHead>
                  <TableHead className="hidden lg:table-cell cursor-pointer hover:bg-muted/50 min-w-[150px]" onClick={() => handleSort('lastUpdated')}>
                    <div className="flex items-center">Última Actualización {renderSortIcon('lastUpdated')}</div>
                  </TableHead>
                  <TableHead className="text-right min-w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.name}
                      {typeof item.lowStockThreshold === 'number' && item.quantity < item.lowStockThreshold && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="destructive" className="ml-2 cursor-default">
                                <AlertTriangleIcon className="h-3 w-3" />
                                <span className="hidden sm:inline ml-1">Bajo Stock</span>
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Cantidad ({item.quantity}) está por debajo del umbral ({item.lowStockThreshold}).</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-xs truncate" title={item.description}>{item.description || '-'}</TableCell>
                    <TableCell className="text-center">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {item.price !== undefined ? `$${item.price.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{item.category || '-'}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {new Date(item.lastUpdated).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {' '}
                      {new Date(item.lastUpdated).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit'})}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/inventario/editar/${item.id}`)}>
                            <Edit3 className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(item)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      {itemToDelete && (
        <DeleteItemDialog
          isOpen={!!itemToDelete}
          onClose={() => setItemToDelete(null)}
          onConfirm={confirmDelete}
          itemName={itemToDelete.name}
        />
      )}
    </Card>
  );
}

    

    