import { Head, Link, router } from '@inertiajs/react';
import { Plus, RotateCcw } from 'lucide-react';
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

export default function Movements({
    movements,
    filters,
    laboratories,
}: {
    movements: Page<Movement>;
    filters: Record<string, string>;
    laboratories: { id: number; name: string }[];
}) {
    const apply = (data: Record<string, string>) =>
        router.get(
            '/inventory/movements',
            { ...filters, ...data },
            { preserveState: true, replace: true },
        );

    const hasFilters = Boolean(filters.laboratory_id || filters.type);

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
                            ? `+${qty.toLocaleString('id-ID')}`
                            : qty.toLocaleString('id-ID')}{' '}
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
    ];

    return (
        <>
            <Head title="Pergerakan Stok" />
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
                <PageHeading
                    title="Pergerakan Stok"
                    actions={
                        <Button asChild size="sm" className="gap-1.5">
                            <Link href="/inventory/create?type=RECEIVING">
                                <Plus className="size-4" />
                                Catat Pergerakan
                            </Link>
                        </Button>
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
