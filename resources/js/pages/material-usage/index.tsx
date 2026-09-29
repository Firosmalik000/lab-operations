import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';
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

type Usage = {
    id: number;
    number: string;
    usage_date: string;
    purpose: string | null;
    status: string;
    items_count: number;
    laboratory: { name: string };
    creator: { name: string };
};
type Page<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
};

export default function UsageIndex({
    usages,
    filters,
    laboratories,
    can,
}: {
    usages: Page<Usage>;
    filters: Record<string, string>;
    laboratories: { id: number; name: string }[];
    can: { create: boolean };
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const apply = (data: Record<string, string>) =>
        router.get(
            '/material-usages',
            { ...filters, ...data },
            { preserveState: true, replace: true },
        );
    return (
        <>
            <Head title="Riwayat Penggunaan" />
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
                <PageHeading
                    title="Riwayat Penggunaan"
                    description="Telusuri transaksi per laboratorium, tanggal, petugas, atau status."
                    actions={
                        can.create && (
                            <Button asChild>
                                <Link href="/material-usages/create">
                                    <Plus aria-hidden="true" />
                                    Catat Penggunaan
                                </Link>
                            </Button>
                        )
                    }
                />
                <Card>
                    <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_220px_180px_auto]">
                        <form
                            className="relative"
                            onSubmit={(event) => {
                                event.preventDefault();
                                apply({ search });
                            }}
                        >
                            <Search
                                className="absolute top-3 left-3 size-4 text-muted-foreground"
                                aria-hidden="true"
                            />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                                placeholder="Cari nomor atau keperluan…"
                                aria-label="Cari transaksi"
                            />
                        </form>
                        <Select
                            value={filters.laboratory_id || 'all'}
                            onValueChange={(value) =>
                                apply({
                                    laboratory_id: value === 'all' ? '' : value,
                                })
                            }
                        >
                            <SelectTrigger aria-label="Filter laboratorium">
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
                            onValueChange={(value) =>
                                apply({ status: value === 'all' ? '' : value })
                            }
                        >
                            <SelectTrigger aria-label="Filter status">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    Semua status
                                </SelectItem>
                                <SelectItem value="DRAFT">DRAFT</SelectItem>
                                <SelectItem value="SUBMITTED">
                                    SUBMITTED
                                </SelectItem>
                                <SelectItem value="VOIDED">VOIDED</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            variant="outline"
                            onClick={() => router.get('/material-usages')}
                        >
                            Reset
                        </Button>
                    </CardContent>
                </Card>
                {usages.data.length === 0 ? (
                    <EmptyState
                        title="Transaksi tidak ditemukan"
                        description="Ubah filter atau catat penggunaan bahan baru."
                    />
                ) : (
                    <>
                        <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 text-left text-muted-foreground">
                                    <tr>
                                        <th className="p-4">Nomor / Tanggal</th>
                                        <th className="p-4">Laboratorium</th>
                                        <th className="p-4">Keperluan</th>
                                        <th className="p-4">Petugas</th>
                                        <th className="p-4">Item</th>
                                        <th className="p-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {usages.data.map((usage) => (
                                        <tr
                                            key={usage.id}
                                            className="hover:bg-muted/30"
                                        >
                                            <td className="p-4">
                                                <Link
                                                    className="font-medium text-primary hover:underline"
                                                    href={`/material-usages/${usage.id}`}
                                                >
                                                    {usage.number}
                                                </Link>
                                                <p className="text-muted-foreground">
                                                    {usage.usage_date}
                                                </p>
                                            </td>
                                            <td className="p-4">
                                                {usage.laboratory.name}
                                            </td>
                                            <td className="max-w-xs p-4">
                                                {usage.purpose || '—'}
                                            </td>
                                            <td className="p-4">
                                                {usage.creator.name}
                                            </td>
                                            <td className="p-4 tabular-nums">
                                                {usage.items_count}
                                            </td>
                                            <td className="p-4">
                                                <Badge
                                                    variant={
                                                        usage.status ===
                                                        'VOIDED'
                                                            ? 'destructive'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {usage.status}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="grid gap-3 md:hidden">
                            {usages.data.map((usage) => (
                                <Link
                                    href={`/material-usages/${usage.id}`}
                                    key={usage.id}
                                    className="rounded-xl border bg-card p-4 shadow-sm"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-semibold text-primary">
                                                {usage.number}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {usage.usage_date}
                                            </p>
                                        </div>
                                        <Badge
                                            variant={
                                                usage.status === 'VOIDED'
                                                    ? 'destructive'
                                                    : 'secondary'
                                            }
                                        >
                                            {usage.status}
                                        </Badge>
                                    </div>
                                    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <dt className="text-muted-foreground">
                                                Laboratorium
                                            </dt>
                                            <dd>{usage.laboratory.name}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-muted-foreground">
                                                Petugas
                                            </dt>
                                            <dd>{usage.creator.name}</dd>
                                        </div>
                                        <div className="col-span-2">
                                            <dt className="text-muted-foreground">
                                                Keperluan
                                            </dt>
                                            <dd>
                                                {usage.purpose || '—'} ·{' '}
                                                {usage.items_count} item
                                            </dd>
                                        </div>
                                    </dl>
                                </Link>
                            ))}
                        </div>
                        <Pagination links={usages.links} />
                    </>
                )}
            </div>
        </>
    );
}

UsageIndex.layout = {
    breadcrumbs: [{ title: 'Penggunaan Bahan', href: '/material-usages' }],
};
