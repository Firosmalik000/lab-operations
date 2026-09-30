import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface ConfirmDeleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
    itemName?: string;
    loading?: boolean;
}

export function ConfirmDeleteDialog({
    open,
    onOpenChange,
    onConfirm,
    title = 'Konfirmasi Hapus',
    description = 'Tindakan ini tidak dapat dibatalkan. Data akan dihapus secara permanen dari sistem.',
    itemName,
    loading = false,
}: ConfirmDeleteDialogProps) {
    return (
        <Dialog
            open={open}
            onOpenChange={(val) => !loading && onOpenChange(val)}
        >
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="gap-2">
                    <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                        <AlertTriangle className="size-5" />
                    </div>
                    <DialogTitle className="text-lg font-semibold">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        {itemName ? (
                            <>
                                Apakah Anda yakin ingin menghapus{' '}
                                <span className="font-semibold text-foreground">
                                    {itemName}
                                </span>
                                ? {description}
                            </>
                        ) : (
                            description
                        )}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4 gap-2 sm:gap-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        Batal
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading && (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                        )}
                        Hapus Data
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
