'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EditStoreForm } from './edit-store-form';

interface Store {
  id: string;
  name: string;
  platform: string;
  url: string;
  api_key?: string;
  api_secret?: string;
  api_version?: string;
}

interface UpdateStoreDialogProps {
  store: Store;
  open: boolean;
  onClose: () => void;
}

export function UpdateStoreDialog({ store, open, onClose }: UpdateStoreDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar Loja</DialogTitle>
          <DialogDescription>
            Atualize as informações da sua loja
          </DialogDescription>
        </DialogHeader>
        
        <EditStoreForm 
          store={store}
          onSuccess={onClose}
        />
      </DialogContent>
    </Dialog>
  );
} 