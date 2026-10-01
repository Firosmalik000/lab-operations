import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { PageHeading } from '@/components/page-heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { type Column, DataTable } from '@/components/ui/data-table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type Movement = {
    id: number;
    type: string;
    quantity: string;
    created_at: string;
    reference_type: string | null;
    reference_id: number | null;
    notes: string | null;
    item: { name: string; code: string };
    laboratory: { name: string };
    unit: { symbol: string };
    creator: { name: string };
};

type Page<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
};

const types = [
    'OPENING',
    'RECEIVING',
    'USAGE',
    'ADJUSTMENT_IN',
    'ADJUSTMENT_OUT',
    'REVERSAL',
];
const manualTypes = ['OPENING', 'RECEIVING', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT'];

export default function Movements({
    movements,
    filters,
    laboratories,
    can,
}: {
    movements: Page<Movement>;
    filters: Record<string, string>;
    laboratories: { id: number; name: string }[];
    can: { create: boolean; update: boolean; delete: boolean };
}) {
    const [deletingMovement, setDeletingMovement] = useState<Movement | null>(
        null,
    );
    const [isDeleting, setIsDeleting] = useState(false);

    const apply = (data: Record<string, string>) =>
        router.get(
            '/inventory/movements',
            { ...filters, ...data },
            { preserveState: true, replace: true },
        );

    const hasFilters = Boolean(filters.laboratory_id || filters.type);
    const isManual = (movement: Movement) =>
        movement.reference_type === null && manualTypes.includes(movement.type);

    const confirmDelete = () => {
        if (!deletingMovement) return;
        setIsDeleting(true);
        router.delete(`/inventory/movements/${deletingMovement.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeletingMovement(null),
            onFinish: () => setIsDeleting(false),
        });
    };

    const getTypeBadgeVariant = (type: string) => {
        if (['RECEIVING', 'OPENING', 'ADJUSTMENT_IN'].includes(type))
            return 'secondary';
        if (['USAGE', 'ADJUSTMENT_OUT'].includes(type)) return 'outline';
        return 'destructive';
    };

    const columns: Column<Movement>[] = [
        {
            header: 'Waktu',
            className:
                'text-xs text-muted-foreground whitespace-nowrap tabular-nums',
            cell: (m) =>
                new Date(m.created_at).toLocaleString('id-ID', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                }),
        },
        {
            header: 'Tipe Mutasi',
            cell: (m) => (
                <Badge
                    variant={getTypeBadgeVariant(m.type)}
                    className="font-mono text-xs"
                >
                    {m.type}
                </Badge>
            ),
        },
        {
            header: 'Item',
            cell: (m) => (
                <div className="min-w-[140px]">
                    <p className="font-semibold text-foreground">
                        {m.item.name}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                        {m.item.code}
                    </p>
                </div>
            ),
        },
        {
            header: 'Laboratorium',
            className: 'text-sm font-medium text-foreground',
            cell: (m) => m.laboratory.name,
        },
        {
            header: 'Jumlah',
            className: 'tabular-nums',
            cell: (m) => {
                const qty = Number(m.quantity);
                const isPositive = qty > 0;
                return (
                    <span
                        className={`font-semibold ${isPositive ? 'text-primary' : 'text-foreground'}`}
                    >
                        {isPositive
                            ? `+${qty.toLocaleString('id-ID', { maximumFractionDigits: 2 })}`
                            : qty.toLocaleString('id-ID', {
                                  maximumFractionDigits: 2,
                              })}{' '}
                        <span className="text-xs font-normal text-muted-foreground">
                            {m.unit.symbol}
                        </span>
                    </span>
                );
            },
        },
        {
            header: 'Petugas',
            className: 'hidden md:table-cell text-xs text-muted-foreground',
            cell: (m) => m.creator.name,
        },
        {
            header: 'Catatan',
            className: 'hidden lg:table-cell max-w-xs',
            cell: (m) => (
                <p className="truncate text-xs text-muted-foreground">
                    {m.notes || '—'}
                </p>
            ),
        },
        {
            header: <span className="sr-only">Aksi</span>,
            className: 'text-right whitespace-nowrap',
            cell: (movement) => (
                <div className="flex items-center justify-end gap-1">
                    {isManual(movement) && can.update && (
                        <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-muted-foreground hover:text-foreground"
                            asChild
                            title="Edit Mutasi"
                        >
                            <Link
                                href={`/inventory/movements/${movement.id}/edit`}
                            >
                                <Pencil className="size-3.5" />
                            </Link>
                        </Button>
                    )}
                    {isManual(movement) && can.delete && (
                        <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeletingMovement(movement)}
                            title="Hapus Mutasi"
                        >
                            <Trash2 className="size-3.5" />
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <>
            <Head title="Pergerakan Stok" />
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
                <PageHeading
                    title="Pergerakan Stok"
                    actions={
                        can.create && (
                            <Button asChild size="sm" className="gap-1.5">
                                <Link href="/inventory/create?type=RECEIVING">
                                    <Plus className="size-4" />
                                    Catat Pergerakan
                                </Link>
                            </Button>
                        )
                    }
                />

                <Card>
                    <CardContent className="grid gap-3 p-3.5 sm:grid-cols-[200px_200px_auto]">
                        <Select
                            value={filters.laboratory_id || 'all'}
                            onValueChange={(v) =>
                                apply({ laboratory_id: v === 'all' ? '' : v })
                            }
                        >
                            <SelectTrigger className="h-9 text-sm">
                                <SelectValue placeholder="Semua laboratorium" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    Semua laboratorium
                                </SelectItem>
                                {laboratories.map((lab) => (
                                    <SelectItem
                                        key={lab.id}
                                        value={String(lab.id)}
                                    >
                                        {lab.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select
                            value={filters.type || 'all'}
                            onValueChange={(v) =>
                                apply({ type: v === 'all' ? '' : v })
                            }
                        >
                            <SelectTrigger className="h-9 text-sm">
                                <SelectValue placeholder="Semua tipe" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua tipe</SelectItem>
                                {types.map((type) => (
                                    <SelectItem key={type} value={type}>
                                        {type}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {hasFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 px-2.5 text-muted-foreground"
                                onClick={() =>
                                    router.get('/inventory/movements')
                                }
                                title="Reset filter"
                            >
                                <RotateCcw className="size-4" />
                            </Button>
                        )}
                    </CardContent>
                </Card>

                <DataTable
                    data={movements.data}
                    columns={columns}
                    keyExtractor={(m) => m.id}
                    paginationLinks={movements.links}
                    emptyTitle="Belum ada pergerakan stok"
                    emptyDescription="Ubah filter pencarian atau catat pergerakan baru."
                />

                <ConfirmDeleteDialog
                    open={Boolean(deletingMovement)}
                    onOpenChange={(open) => !open && setDeletingMovement(null)}
                    itemName={
                        deletingMovement
                            ? `${deletingMovement.type} — ${deletingMovement.item.name}`
                            : undefined
                    }
                    title="Hapus Pergerakan Stok"
                    description="Pergerakan stok ini akan dihapus permanen dan saldo stok akan dihitung ulang secara otomatis."
                    loading={isDeleting}
                    onConfirm={confirmDelete}
                />
            </div>
        </>
    );
}

Movements.layout = {
    breadcrumbs: [
        { title: 'Inventory', href: '/inventory/stock' },
        { title: 'Pergerakan Stok', href: '/inventory/movements' },
    ],
};
