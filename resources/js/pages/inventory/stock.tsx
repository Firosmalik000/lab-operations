import { Head, Link, router } from '@inertiajs/react';
import { ArrowDownToLine, Search, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import { PageHeading } from '@/components/page-heading';
import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
function status(stock: Stock): {
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
}: {
    stocks: Page<Stock>;
    filters: Record<string, string>;
    laboratories: { id: number; name: string }[];
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const apply = (data: Record<string, string>) =>
        router.get(
            '/inventory/stock',
            { ...filters, ...data },
            { preserveState: true, replace: true },
        );
    return (
        <>
            <Head title="Stok Saat Ini" />
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
                <PageHeading
                    title="Stok Saat Ini"
                    description="Saldo dihitung langsung dari seluruh pergerakan stok, bukan dari angka yang dapat diedit manual."
                    actions={
                        <>
                            <Button asChild variant="outline">
                                <Link href="/inventory/create?type=RECEIVING">
                                    <ArrowDownToLine aria-hidden="true" />
                                    Penerimaan
                                </Link>
                            </Button>
                            <Button asChild>
                                <Link href="/inventory/create?type=ADJUSTMENT_IN">
                                    <SlidersHorizontal aria-hidden="true" />
                                    Penyesuaian
                                </Link>
                            </Button>
                        </>
                    }
                />
                <Card>
                    <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_220px_180px]">
                        {' '}
                        <form
                            className="relative"
                            onSubmit={(e) => {
                                e.preventDefault();
                                apply({ search });
                            }}
                        >
                            <Search className="absolute top-3 left-3 size-4 text-muted-foreground" />
                            <Input
                                className="pl-9"
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
                            value={filters.status || 'all'}
                            onValueChange={(v) =>
                                apply({ status: v === 'all' ? '' : v })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    Semua status
                                </SelectItem>
                                <SelectItem value="low">Stok Rendah</SelectItem>
                                <SelectItem value="empty">Habis</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>
                {stocks.data.length === 0 ? (
                    <EmptyState
                        title="Belum ada saldo stok"
                        description="Catat stok awal atau penerimaan untuk item dengan mode STOCK."
                    />
                ) : (
                    <>
                        <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 text-left">
                                    <tr>
                                        <th className="p-4">Item</th>
                                        <th className="p-4">Kategori</th>
                                        <th className="p-4">Laboratorium</th>
                                        <th className="p-4 text-right">Stok</th>
                                        <th className="p-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {stocks.data.map((stock) => {
                                        const state = status(stock);
                                        return (
                                            <tr
                                                key={`${stock.item_id}-${stock.laboratory}-${stock.symbol}`}
                                            >
                                                <td className="p-4">
                                                    <p className="font-medium">
                                                        {stock.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {stock.code}
                                                    </p>
                                                </td>
                                                <td className="p-4">
                                                    {stock.category ?? '—'}
                                                </td>
                                                <td className="p-4">
                                                    {stock.laboratory}
                                                </td>
                                                <td className="p-4 text-right text-lg font-semibold tabular-nums">
                                                    {stock.balance}{' '}
                                                    {stock.symbol}
                                                </td>
                                                <td className="p-4">
                                                    <Badge
                                                        variant={state.variant}
                                                    >
                                                        {state.label}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="grid gap-3 md:hidden">
                            {stocks.data.map((stock) => {
                                const state = status(stock);
                                return (
                                    <Card
                                        key={`${stock.item_id}-${stock.laboratory}-${stock.symbol}`}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="font-medium">
                                                        {stock.name}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {stock.laboratory} ·{' '}
                                                        {stock.category ??
                                                            'Tanpa kategori'}
                                                    </p>
                                                </div>
                                                <Badge variant={state.variant}>
                                                    {state.label}
                                                </Badge>
                                            </div>
                                            <p className="mt-5 text-2xl font-semibold tabular-nums">
                                                {stock.balance}{' '}
                                                <span className="text-base font-normal text-muted-foreground">
                                                    {stock.symbol}
                                                </span>
                                            </p>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                        <Pagination links={stocks.links} />
                    </>
                )}
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
