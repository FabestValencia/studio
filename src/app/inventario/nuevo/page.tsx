import { ItemForm } from '@/components/inventory/item-form';

export const metadata = {
  title: 'Añadir Nuevo Artículo - QMD Inventario',
};

export default function AddNewItemPage() {
  return (
    <div className="container mx-auto py-8">
      <ItemForm />
    </div>
  );
}
