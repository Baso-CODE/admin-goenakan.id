"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface ConfirmCancelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  warningMessage?: string;
  isLoading?: boolean;
}

export function ConfirmCancelDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Batalkan Pesanan Ini?",
  description = "Tindakan ini akan mengubah status pesanan menjadi dibatalkan dan menghapus dokumen PO client yang terkait secara permanen.",
  warningMessage,
  isLoading = false,
}: ConfirmCancelDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>
              {description}
              {/* Jika ada pesan warning khusus, tampilkan di bawahnya */}
              {warningMessage && (
                <span className="text-red-500 font-medium text-xs mt-2 block">
                  * {warningMessage}
                </span>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isLoading}>
            Kembali
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault(); // Mencegah dialog langsung tertutup sebelum proses API selesai
              onConfirm();
            }}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Membatalkan...
              </>
            ) : (
              "Ya, Batalkan Order"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
