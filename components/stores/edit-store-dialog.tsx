'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EditStoreForm } from './edit-store-form';

interface EditStoreDialogProps {
  store: {
    id: string;
    name: string;
    platform: string;
    url: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditStoreDialog({
  store,
  open,
  onOpenChange,
}: EditStoreDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Loja</DialogTitle>
          <DialogDescription>
            Faça as alterações necessárias nos dados da sua loja.
          </DialogDescription>
        </DialogHeader>
        {store && (
          <EditStoreForm 
            store={store} 
            onSuccess={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
