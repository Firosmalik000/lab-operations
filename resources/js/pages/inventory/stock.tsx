import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowDownToLine,
    Pencil,
    RotateCcw,
    Search,
    SlidersHorizontal,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { PageHeading } from '@/components/page-heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { type Column, DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type Stock = {
    item_id: number;
    laboratory_id: number;
    code: string;
    name: string;
    category: string | null;
    laboratory: string;
    balance: string;
    symbol: string;
    minimum_stock: string | null;
};

type Page<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
};

function getStockStatus(stock: Stock): {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
} {
    const balance = Number(stock.balance);
    if (balance <= 0) return { label: 'Habis', variant: 'destructive' };
    if (stock.minimum_stock !== null && balance <= Number(stock.minimum_stock))
        return { label: 'Stok Rendah', variant: 'secondary' };
    return { label: 'Normal', variant: 'outline' };
}

export default function StockIndex({
    stocks,
    filters,
    laboratories,
    can,
}: {
    stocks: Page<Stock>;
    filters: Record<string, string>;
    laboratories: { id: number; name: string }[];
    can: { update: boolean; delete: boolean };
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [deletingStock, setDeletingStock] = useState<Stock | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const apply = (data: Record<string, string>) =>
        router.get(
            '/inventory/stock',
            { ...filters, ...data },
            { preserveState: true, replace: true },
        );

    const hasFilters = Boolean(
        filters.search || filters.laboratory_id || filters.status,
    );

    const confirmDelete = () => {
        if (!deletingStock) return;
        setIsDeleting(true);
        router.delete(`/master/items/${deletingStock.item_id}`, {
            preserveScroll: true,
            onSuccess: () => setDeletingStock(null),
            onFinish: () => setIsDeleting(false),
        });
    };

    const columns: Column<Stock>[] = [
        {
            header: 'Item',
            cell: (stock) => (
                <div className="min-w-[150px]">
                    <p className="font-semibold text-foreground">
                        {stock.name}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                        {stock.code}
                    </p>
                </div>
            ),
        },
        {
            header: 'Kategori',
            className: 'hidden sm:table-cell text-sm text-muted-foreground',
            cell: (stock) => stock.category || '—',
        },
        {
            header: 'Laboratorium',
            className: 'text-sm font-medium text-foreground',
            cell: (stock) => stock.laboratory,
        },
        {
            header: 'Saldo Stok',
            className: 'tabular-nums',
            cell: (stock) => (
                <span className="font-semibold text-foreground">
                    {Number(stock.balance).toLocaleString('id-ID', {
                        maximumFractionDigits: 2,
                    })}{' '}
                    {stock.symbol}
                </span>
            ),
        },
        {
            header: 'Min. Stok',
            className:
                'hidden md:table-cell tabular-nums text-xs text-muted-foreground',
            cell: (stock) =>
                stock.minimum_stock !== null
                    ? `${Number(stock.minimum_stock).toLocaleString('id-ID', { maximumFractionDigits: 2 })} ${stock.symbol}`
                    : '—',
        },
        {
            header: 'Status',
            cell: (stock) => {
                const s = getStockStatus(stock);
                return (
                    <Badge variant={s.variant} className="text-xs">
                        {s.label}
                    </Badge>
                );
            },
        },
    ];

    if (can.update || can.delete) {
        columns.push({
            header: <span className="sr-only">Aksi</span>,
            className: 'text-right whitespace-nowrap',
            cell: (stock) => (
                <div className="flex items-center justify-end gap-1">
                    {can.update && (
                        <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-muted-foreground hover:text-foreground"
                            asChild
                            title="Edit Stok"
                        >
                            <Link
                                href={`/master/items?edit=${stock.item_id}&return_to=stock`}
                            >
                                <Pencil className="size-3.5" />
                                <span className="sr-only">Edit stok</span>
                            </Link>
                        </Button>
                    )}
                    {can.delete && (
                        <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeletingStock(stock)}
                            title="Hapus Stok"
                        >
                            <Trash2 className="size-3.5" />
                            <span className="sr-only">Hapus stok</span>
                        </Button>
                    )}
                </div>
            ),
        });
    }

    return (
        <>
            <Head title="Stok Saat Ini" />
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
                <PageHeading
                    title="Stok Saat Ini"
                    actions={
                        <div className="flex items-center gap-2">
                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="gap-1.5"
                            >
                                <Link href="/inventory/create?type=RECEIVING">
                                    <ArrowDownToLine className="size-4" />
                                    Penerimaan
                                </Link>
                            </Button>
                            <Button asChild size="sm" className="gap-1.5">
                                <Link href="/inventory/create?type=ADJUSTMENT_IN">
                                    <SlidersHorizontal className="size-4" />
                                    Penyesuaian
                                </Link>
                            </Button>
                        </div>
                    }
                />

                <Card>
                    <CardContent className="grid gap-3 p-3.5 sm:grid-cols-[1fr_200px_160px_auto]">
                        <form
                            className="relative"
                            onSubmit={(e) => {
                                e.preventDefault();
                                apply({ search });
                            }}
                        >
                            <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
                            <Input
                                className="h-9 pl-9 text-sm"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari item…"
                            />
                        </form>
                        <Select
                            value={filters.laboratory_id || 'all'}
                            onValueChange={(v) =>
                                apply({ laboratory_id: v === 'all' ? '' : v })
                            }
                        >
                            <SelectTrigger className="h-9 text-sm">
                                <SelectValue placeholder="Semua lab" />
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
                            value={filters.status || 'all'}
                            onValueChange={(v) =>
                                apply({ status: v === 'all' ? '' : v })
                            }
                        >
                            <SelectTrigger className="h-9 text-sm">
                                <SelectValue placeholder="Semua status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    Semua status
                                </SelectItem>
                                <SelectItem value="low">Stok Rendah</SelectItem>
                                <SelectItem value="empty">Habis</SelectItem>
                            </SelectContent>
                        </Select>
                        {hasFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 px-2.5 text-muted-foreground"
                                onClick={() => router.get('/inventory/stock')}
                                title="Reset filter"
                            >
                                <RotateCcw className="size-4" />
                            </Button>
                        )}
                    </CardContent>
                </Card>

                <DataTable
                    data={stocks.data}
                    columns={columns}
                    keyExtractor={(stock) =>
                        `${stock.item_id}-${stock.laboratory_id}`
                    }
                    paginationLinks={stocks.links}
                    emptyTitle="Tidak ada data stok"
                    emptyDescription="Ubah filter pencarian atau catat penerimaan stok baru."
                />

                <ConfirmDeleteDialog
                    open={Boolean(deletingStock)}
                    onOpenChange={(open) => !open && setDeletingStock(null)}
                    itemName={
                        deletingStock
                            ? `${deletingStock.name} di ${deletingStock.laboratory}`
                            : undefined
                    }
                    title="Hapus Stok"
                    description="Item stok akan dihapus permanen. Item yang sudah memiliki riwayat mutasi atau penggunaan tidak dapat dihapus."
                    loading={isDeleting}
                    onConfirm={confirmDelete}
                />
            </div>
        </>
    );
}

StockIndex.layout = {
    breadcrumbs: [
        { title: 'Inventory', href: '/inventory/stock' },
        { title: 'Stok Saat Ini', href: '/inventory/stock' },
    ],
};
