import { Head, Link, router } from '@inertiajs/react';
import { Eye, Plus, RotateCcw, Search, Trash2 } from 'lucide-react';
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
    can: { create: boolean; void: boolean; delete: boolean };
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [deletingUsage, setDeletingUsage] = useState<Usage | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const apply = (data: Record<string, string>) =>
        router.get(
            '/material-usages',
            { ...filters, ...data },
            { preserveState: true, replace: true },
        );

    const confirmDelete = () => {
        if (!deletingUsage) return;
        setIsDeleting(true);
        router.delete(`/material-usages/${deletingUsage.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeletingUsage(null),
            onFinish: () => setIsDeleting(false),
        });
    };

    const hasFilters = Boolean(
        filters.search || filters.laboratory_id || filters.status,
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'VOIDED':
                return (
                    <Badge variant="destructive" className="text-xs">
                        VOIDED
                    </Badge>
                );
            case 'DRAFT':
                return (
                    <Badge variant="outline" className="text-xs">
                        DRAFT
                    </Badge>
                );
            case 'SUBMITTED':
            default:
                return (
                    <Badge variant="secondary" className="text-xs">
                        SUBMITTED
                    </Badge>
                );
        }
    };

    const columns: Column<Usage>[] = [
        {
            header: 'Nomor & Tanggal',
            cell: (usage) => (
                <div className="min-w-[150px]">
                    <Link
                        href={`/material-usages/${usage.id}`}
                        className="font-semibold text-primary hover:underline"
                    >
                        {usage.number}
                    </Link>
                    <p className="text-xs text-muted-foreground tabular-nums">
                        {usage.usage_date}
                    </p>
                </div>
            ),
        },
        {
            header: 'Laboratorium',
            cell: (usage) => (
                <span className="text-sm font-medium text-foreground">
                    {usage.laboratory.name}
                </span>
            ),
        },
        {
            header: 'Keperluan',
            className: 'hidden sm:table-cell max-w-xs',
            cell: (usage) => (
                <p className="truncate text-xs text-muted-foreground">
                    {usage.purpose || '—'}
                </p>
            ),
        },
        {
            header: 'Petugas',
            className: 'hidden md:table-cell text-xs text-muted-foreground',
            cell: (usage) => usage.creator.name,
        },
        {
            header: 'Item',
            className: 'tabular-nums text-sm',
            cell: (usage) => `${usage.items_count} item`,
        },
        {
            header: 'Status',
            cell: (usage) => getStatusBadge(usage.status),
        },
        {
            header: <span className="sr-only">Aksi</span>,
            className: 'text-right whitespace-nowrap',
            cell: (usage) => (
                <div className="flex items-center justify-end gap-1">
                    <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-muted-foreground hover:text-foreground"
                        asChild
                        title="Lihat Detail"
                    >
                        <Link href={`/material-usages/${usage.id}`}>
                            <Eye className="size-3.5" />
                        </Link>
                    </Button>
                    {usage.status === 'DRAFT' && can.delete && (
                        <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeletingUsage(usage)}
                            title="Hapus Draf"
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
            <Head title="Riwayat Penggunaan" />
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
                <PageHeading
                    title="Riwayat Penggunaan"
                    actions={
                        can.create && (
                            <Button asChild size="sm" className="gap-1.5">
                                <Link href="/material-usages/create">
                                    <Plus className="size-4" />
                                    Catat Penggunaan
                                </Link>
                            </Button>
                        )
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
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-9 pl-9 text-sm"
                                placeholder="Cari nomor atau keperluan…"
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
                            onValueChange={(value) =>
                                apply({ status: value === 'all' ? '' : value })
                            }
                        >
                            <SelectTrigger className="h-9 text-sm">
                                <SelectValue placeholder="Semua status" />
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
                        {hasFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 px-2.5 text-muted-foreground"
                                onClick={() => router.get('/material-usages')}
                                title="Reset filter"
                            >
                                <RotateCcw className="size-4" />
                            </Button>
                        )}
                    </CardContent>
                </Card>

                <DataTable
                    data={usages.data}
                    columns={columns}
                    keyExtractor={(usage) => usage.id}
                    paginationLinks={usages.links}
                    emptyTitle="Transaksi tidak ditemukan"
                    emptyDescription="Ubah filter pencarian atau catat penggunaan bahan baru."
                />

                <ConfirmDeleteDialog
                    open={Boolean(deletingUsage)}
                    onOpenChange={(v) => !v && setDeletingUsage(null)}
                    itemName={deletingUsage?.number}
                    title="Hapus Draf Penggunaan"
                    description="Draf penggunaan bahan ini akan dihapus permanen beserta seluruh item di dalamnya."
                    loading={isDeleting}
                    onConfirm={confirmDelete}
                />
            </div>
        </>
    );
}

UsageIndex.layout = {
    breadcrumbs: [{ title: 'Penggunaan Bahan', href: '/material-usages' }],
};
