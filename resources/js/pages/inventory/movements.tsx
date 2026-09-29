import { Head, Link, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { PageHeading } from '@/components/page-heading';
import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
    return (
        <>
            <Head title="Pergerakan Stok" />
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
                <PageHeading
                    title="Pergerakan Stok"
                    description="Ledger lengkap setiap penambahan, pengurangan, dan pembalikan stok."
                    actions={
                        <Button asChild>
                            <Link href="/inventory/create?type=RECEIVING">
                                <Plus />
                                Catat Pergerakan
                            </Link>
                        </Button>
                    }
                />
                <Card>
                    <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
                        <Select
                            value={filters.laboratory_id || 'all'}
                            onValueChange={(v) =>
                                apply({ laboratory_id: v === 'all' ? '' : v })
                            }
                        >
                            <SelectTrigger>
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
                            <SelectTrigger>
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
                    </CardContent>
                </Card>
                {movements.data.length === 0 ? (
                    <EmptyState title="Belum ada pergerakan stok" />
                ) : (
                    <>
                        <div className="grid gap-3">
                            {movements.data.map((movement) => (
                                <Card key={movement.id}>
                                    <CardContent className="grid items-center gap-3 p-4 sm:grid-cols-[1fr_180px_180px_180px]">
                                        <div>
                                            <p className="font-medium">
                                                {movement.item.name}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {movement.item.code} ·{' '}
                                                {movement.laboratory.name}
                                            </p>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className="w-fit"
                                        >
                                            {movement.type}
                                        </Badge>
                                        <p
                                            className={`text-lg font-semibold tabular-nums ${Number(movement.quantity) < 0 ? 'text-destructive' : 'text-emerald-700 dark:text-emerald-400'}`}
                                        >
                                            {Number(movement.quantity) > 0
                                                ? '+'
                                                : ''}
                                            {movement.quantity}{' '}
                                            {movement.unit.symbol}
                                        </p>
                                        <div className="text-sm">
                                            <p>
                                                {new Date(
                                                    movement.created_at,
                                                ).toLocaleString('id-ID')}
                                            </p>
                                            <p className="text-muted-foreground">
                                                {movement.creator.name}
                                            </p>
                                            {movement.reference_id &&
                                                movement.reference_type?.includes(
                                                    'MaterialUsage',
                                                ) && (
                                                    <Link
                                                        href={`/material-usages/${movement.reference_id}`}
                                                        className="text-primary hover:underline"
                                                    >
                                                        Lihat penggunaan
                                                    </Link>
                                                )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <Pagination links={movements.links} />
                    </>
                )}
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
