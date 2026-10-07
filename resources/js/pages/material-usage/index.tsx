import { Head, Link, router } from '@inertiajs/react';
import {
    Calendar,
    Eye,
    Pencil,
    Plus,
    RotateCcw,
    Search,
    Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
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
    from?: number | null;
    to?: number | null;
    total?: number;
    current_page?: number;
    per_page?: number;
};

const getDefaultDateRange = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const pad = (n: number) => String(n).padStart(2, '0');
    const start = `${year}-${pad(month + 1)}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const end = `${year}-${pad(month + 1)}-${pad(lastDay)}`;
    return { start, end };
};

const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
        const [year, month, day] = dateStr.split('-');
        if (year && month && day) {
            const date = new Date(Number(year), Number(month) - 1, Number(day));
            return new Intl.DateTimeFormat('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            }).format(date);
        }
        return dateStr;
    } catch {
        return dateStr;
    }
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
    can: { create: boolean; update: boolean; delete: boolean };
}) {
    const defaultDates = getDefaultDateRange();
    const [search, setSearch] = useState(filters.search ?? '');
    const [dateFrom, setDateFrom] = useState(
        filters.date_from ?? defaultDates.start,
    );
    const [dateTo, setDateTo] = useState(filters.date_to ?? defaultDates.end);
    const [deletingUsage, setDeletingUsage] = useState<Usage | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        setDateFrom(filters.date_from ?? defaultDates.start);
    }, [filters.date_from, defaultDates.start]);

    useEffect(() => {
        setDateTo(filters.date_to ?? defaultDates.end);
    }, [filters.date_to, defaultDates.end]);

    const apply = (data: Record<string, string>) =>
        router.get(
            '/material-usages',
            { ...filters, ...data },
            { preserveState: true, replace: true },
        );

    const handleDateFromChange = (value: string) => {
        setDateFrom(value);
        apply({ date_from: value });
    };

    const handleDateToChange = (value: string) => {
        setDateTo(value);
        apply({ date_to: value });
    };

    const setToday = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        setDateFrom(todayStr);
        setDateTo(todayStr);
        apply({ date_from: todayStr, date_to: todayStr });
    };

    const setCurrentMonth = () => {
        const { start, end } = getDefaultDateRange();
        setDateFrom(start);
        setDateTo(end);
        apply({ date_from: start, date_to: end });
    };

    const resetFilters = () => {
        const { start, end } = getDefaultDateRange();
        setSearch('');
        setDateFrom(start);
        setDateTo(end);
        router.get(
            '/material-usages',
            {
                date_from: start,
                date_to: end,
            },
            { preserveState: true, replace: true },
        );
    };

    const isCustomDate =
        Boolean(
            filters.date_from && filters.date_from !== defaultDates.start,
        ) ||
        Boolean(filters.date_to && filters.date_to !== defaultDates.end);

    const hasFilters = Boolean(
        filters.search ||
            filters.laboratory_id ||
            filters.status ||
            isCustomDate,
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
            header: 'No',
            className: 'w-[80px] whitespace-nowrap',
            headerClassName: 'w-[80px]',
            cell: (usage, index) => {
                const rowNumber = (usages.from ?? 1) + index;
                return (
                    <div className="flex items-center gap-1.5">
                        <span className="min-w-[20px] text-xs font-medium text-muted-foreground tabular-nums">
                            {rowNumber}
                        </span>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 text-muted-foreground hover:text-foreground"
                            asChild
                            title="Lihat Detail"
                        >
                            <Link href={`/material-usages/${usage.id}`}>
                                <Eye className="size-3.5" />
                            </Link>
                        </Button>
                    </div>
                );
            },
        },
        {
            header: 'Tanggal',
            className: 'whitespace-nowrap',
            cell: (usage) => (
                <span className="text-sm font-medium text-foreground tabular-nums">
                    {formatDate(usage.usage_date)}
                </span>
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
            cell: (usage) => {
                const canEdit =
                    ['DRAFT', 'VOIDED'].includes(usage.status) && can.update;
                const canDelete =
                    ['DRAFT', 'VOIDED'].includes(usage.status) && can.delete;

                if (!canEdit && !canDelete) return null;

                return (
                    <div className="flex items-center justify-end gap-1">
                        {canEdit && (
                            <Button
                                size="icon"
                                variant="ghost"
                                className="size-8 text-muted-foreground hover:text-foreground"
                                asChild
                                title={
                                    usage.status === 'VOIDED'
                                        ? 'Edit & Submit Ulang'
                                        : 'Edit Draf'
                                }
                            >
                                <Link
                                    href={`/material-usages/${usage.id}/edit`}
                                >
                                    <Pencil className="size-3.5" />
                                </Link>
                            </Button>
                        )}
                        {canDelete && (
                            <Button
                                size="icon"
                                variant="ghost"
                                className="size-8 text-muted-foreground hover:text-destructive"
                                onClick={() => setDeletingUsage(usage)}
                                title={
                                    usage.status === 'VOIDED'
                                        ? 'Hapus Transaksi VOIDED'
                                        : 'Hapus Draf'
                                }
                            >
                                <Trash2 className="size-3.5" />
                            </Button>
                        )}
                    </div>
                );
            },
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
                    <CardContent className="flex flex-col gap-3 p-3.5 sm:p-4">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <form
                                className="relative sm:col-span-2"
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
                                        laboratory_id:
                                            value === 'all' ? '' : value,
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
                                    apply({
                                        status: value === 'all' ? '' : value,
                                    })
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
                                    <SelectItem value="VOIDED">
                                        VOIDED
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Calendar className="size-3.5 text-muted-foreground" />
                                    <span className="font-medium text-foreground">
                                        Rentang:
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) =>
                                            handleDateFromChange(e.target.value)
                                        }
                                        className="h-8 w-[138px] text-xs"
                                        aria-label="Dari tanggal"
                                    />
                                    <span className="text-xs text-muted-foreground">
                                        s/d
                                    </span>
                                    <Input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) =>
                                            handleDateToChange(e.target.value)
                                        }
                                        className="h-8 w-[138px] text-xs"
                                        aria-label="Sampai tanggal"
                                    />
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8 px-2.5 text-xs"
                                        onClick={setToday}
                                        title="Lihat transaksi hari ini"
                                    >
                                        Hari Ini
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8 px-2.5 text-xs"
                                        onClick={setCurrentMonth}
                                        title="Lihat transaksi bulan ini"
                                    >
                                        Bulan Ini
                                    </Button>
                                </div>
                            </div>

                            {hasFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                                    onClick={resetFilters}
                                    title="Reset filter"
                                >
                                    <RotateCcw className="size-3.5" />
                                    Reset Filter
                                </Button>
                            )}
                        </div>
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
                    title={
                        deletingUsage?.status === 'VOIDED'
                            ? 'Hapus Transaksi VOIDED'
                            : 'Hapus Draf Penggunaan'
                    }
                    description="Transaksi penggunaan ini akan dihapus permanen beserta seluruh item dan movement stok terkait."
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
