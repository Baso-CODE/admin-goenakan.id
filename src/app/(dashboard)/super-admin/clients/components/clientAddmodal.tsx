"use client";

import { ClientData } from "@/app/(dashboard)/admin-invoice/quotations/components/quotationForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import ClientAddForm from "./addClientForm";

export function ClientAddModal({
  isOpen,
  onClose,
  onClientAdded,
}: {
  isOpen: boolean;
  onClose: () => void;
  onClientAdded: (newClient: ClientData) => void;
}) {
  const handleClientAdded = (newClient: ClientData) => {
    onClientAdded(newClient);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>Tambah Client Baru</DialogTitle>
          <DialogDescription>
            Buat client baru langsung dari sini. Client akan otomatis dipilih
            setelah berhasil ditambahkan.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className=" pr-4">
          <ClientAddForm onSuccess={handleClientAdded} isModal={true} />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
