import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Ban,
    CalendarDays,
    FlaskConical,
    Pencil,
    Trash2,
    UserRound,
} from 'lucide-react';
import { useState } from 'react';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import InputError from '@/components/input-error';
import { PageHeading } from '@/components/page-heading';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

type Line = {
    id: number;
    quantity: string;
    notes: string | null;
    item: {
        name: string;
        code: string;
        inventory_mode: string;
        category: { name: string } | null;
    };
    unit: { symbol: string };
};
type Usage = {
    id: number;
    number: string;
    usage_date: string;
    purpose: string | null;
    notes: string | null;
    status: string;
    void_reason: string | null;
    voided_at: string | null;
    laboratory: { name: string };
    creator: { name: string };
    voided_by: { name: string } | null;
    items: Line[];
};

export default function UsageShow({
    usage,
    canVoid,
    canUpdate,
    canDelete = false,
}: {
    usage: Usage;
    canVoid: boolean;
    canUpdate: boolean;
    canDelete?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const form = useForm({ reason: '' });

    const submitVoid = (event: React.FormEvent) => {
        event.preventDefault();
        form.post(`/material-usages/${usage.id}/void`, {
            preserveScroll: true,
            onSuccess: () => setOpen(false),
        });
    };

    const handleDeleteDraft = () => {
        setIsDeleting(true);
        router.delete(`/material-usages/${usage.id}`, {
            preserveScroll: true,
            onFinish: () => setIsDeleting(false),
        });
    };

    return (
        <>
            <Head title={usage.number} />
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
                <PageHeading
                    title={usage.number}
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            <Button asChild variant="outline" size="sm">
                                <Link href="/material-usages">
                                    <ArrowLeft className="size-4" />
                                    Kembali
                                </Link>
                            </Button>
                            {canUpdate &&
                                ['DRAFT', 'VOIDED'].includes(usage.status) && (
                                    <Button asChild size="sm">
                                        <Link
                                            href={`/material-usages/${usage.id}/edit`}
                                        >
                                            <Pencil className="size-4" />
                                            {usage.status === 'VOIDED'
                                                ? 'Edit & Submit Ulang'
                                                : 'Edit Draf'}
                                        </Link>
                                    </Button>
                                )}
                            {canDelete &&
                                ['DRAFT', 'VOIDED'].includes(usage.status) && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-destructive hover:bg-destructive/10"
                                        onClick={() =>
                                            setConfirmDeleteOpen(true)
                                        }
                                    >
                                        <Trash2 className="size-4" />
                                        {usage.status === 'VOIDED'
                                            ? 'Hapus VOIDED'
                                            : 'Hapus Draf'}
                                    </Button>
                                )}
                            {canVoid && usage.status === 'SUBMITTED' && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setOpen(true)}
                                >
                                    <Ban className="size-4" />
                                    Batalkan
                                </Button>
                            )}
                        </div>
                    }
                />
                {usage.status === 'VOIDED' && (
                    <Alert variant="destructive">
                        <Ban aria-hidden="true" />
                        <AlertTitle>Transaksi dibatalkan</AlertTitle>
                        <AlertDescription>
                            {usage.void_reason}{' '}
                            {usage.voided_by &&
                                `— oleh ${usage.voided_by.name}`}
                        </AlertDescription>
                    </Alert>
                )}
                <Card>
                    <CardContent className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CalendarDays
                                    className="size-4"
                                    aria-hidden="true"
                                />
                                Tanggal
                            </p>
                            <p className="mt-1 font-medium">
                                {usage.usage_date}
                            </p>
                        </div>
                        <div>
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                <FlaskConical
                                    className="size-4"
                                    aria-hidden="true"
                                />
                                Laboratorium
                            </p>
                            <p className="mt-1 font-medium">
                                {usage.laboratory.name}
                            </p>
                        </div>
                        <div>
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                <UserRound
                                    className="size-4"
                                    aria-hidden="true"
                                />
                                Petugas
                            </p>
                            <p className="mt-1 font-medium">
                                {usage.creator.name}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Status
                            </p>
                            <Badge
                                className="mt-1"
                                variant={
                                    usage.status === 'VOIDED'
                                        ? 'destructive'
                                        : 'secondary'
                                }
                            >
                                {usage.status}
                            </Badge>
                        </div>
                        <div className="sm:col-span-2 lg:col-span-4">
                            <p className="text-sm text-muted-foreground">
                                Keperluan
                            </p>
                            <p className="mt-1">{usage.purpose || '—'}</p>
                            {usage.notes && (
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {usage.notes}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Bahan yang Digunakan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="hidden overflow-hidden rounded-lg border md:block">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 text-left">
                                    <tr>
                                        <th className="p-3">Item</th>
                                        <th className="p-3">Kategori</th>
                                        <th className="p-3 text-right">
                                            Jumlah
                                        </th>
                                        <th className="p-3">Mode</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {usage.items.map((line) => (
                                        <tr key={line.id}>
                                            <td className="p-3">
                                                <p className="font-medium">
                                                    {line.item.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {line.item.code}
                                                </p>
                                            </td>
                                            <td className="p-3">
                                                {line.item.category?.name ??
                                                    '—'}
                                            </td>
                                            <td className="p-3 text-right font-medium tabular-nums">
                                                {Number(
                                                    line.quantity,
                                                ).toLocaleString('id-ID', {
                                                    maximumFractionDigits: 2,
                                                })}{' '}
                                                {line.unit.symbol}
                                            </td>
                                            <td className="p-3">
                                                <Badge variant="outline">
                                                    {line.item.inventory_mode}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="grid gap-3 md:hidden">
                            {usage.items.map((line) => (
                                <div
                                    key={line.id}
                                    className="rounded-lg border p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-medium">
                                                {line.item.name}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {line.item.category?.name ??
                                                    'Tanpa kategori'}
                                            </p>
                                        </div>
                                        <Badge variant="outline">
                                            {line.item.inventory_mode}
                                        </Badge>
                                    </div>
                                    <p className="mt-4 text-xl font-semibold tabular-nums">
                                        {Number(line.quantity).toLocaleString(
                                            'id-ID',
                                            { maximumFractionDigits: 2 },
                                        )}{' '}
                                        <span className="text-base font-normal text-muted-foreground">
                                            {line.unit.symbol}
                                        </span>
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent>
                        <form onSubmit={submitVoid}>
                            <DialogHeader>
                                <DialogTitle>Batalkan transaksi?</DialogTitle>
                                <DialogDescription>
                                    Riwayat tidak akan dihapus. Stok item STOCK
                                    akan dikembalikan melalui movement REVERSAL.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="my-5 grid gap-2">
                                <Label htmlFor="void-reason">
                                    Alasan pembatalan
                                </Label>
                                <textarea
                                    id="void-reason"
                                    autoFocus
                                    value={form.data.reason}
                                    onChange={(e) =>
                                        form.setData('reason', e.target.value)
                                    }
                                    className="min-h-28 rounded-md border bg-transparent px-3 py-2 text-sm"
                                />
                                <InputError message={form.errors.reason} />
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setOpen(false)}
                                >
                                    Kembali
                                </Button>
                                <Button
                                    type="submit"
                                    variant="destructive"
                                    disabled={form.processing}
                                >
                                    Batalkan Transaksi
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <ConfirmDeleteDialog
                    open={confirmDeleteOpen}
                    onOpenChange={setConfirmDeleteOpen}
                    itemName={usage.number}
                    title={
                        usage.status === 'VOIDED'
                            ? 'Hapus Transaksi VOIDED'
                            : 'Hapus Draf Penggunaan'
                    }
                    description="Transaksi penggunaan ini akan dihapus permanen beserta seluruh item dan movement stok terkait."
                    loading={isDeleting}
                    onConfirm={handleDeleteDraft}
                />
            </div>
        </>
    );
}

UsageShow.layout = {
    breadcrumbs: [
        { title: 'Penggunaan Bahan', href: '/material-usages' },
        { title: 'Detail', href: '#' },
    ],
};
