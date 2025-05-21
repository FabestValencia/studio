
// This is a server component, but data fetching will occur in a client component using the store
// or if we had a DB, it would fetch here. For now, ItemForm will handle fetching via hook.
import { ItemLoader } from '@/components/inventory/item-loader';

export const metadata = {
  title: 'Editar Artículo - QMD Inventario',
};

interface EditItemPageProps {
  params: { id: string };
}

// This component ensures that ItemForm and ItemMovementsList are only rendered on the client
// and receives the item ID to load data.
export default function EditItemPage({ params }: EditItemPageProps) {
  return (
    <div className="container mx-auto py-8">
      <ItemLoader itemId={params.id} />
    </div>
  );
}
