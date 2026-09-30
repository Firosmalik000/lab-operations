import { Head, router } from '@inertiajs/react';
import { Eye, RotateCcw, Search } from 'lucide-react';
import { useState } from 'react';
import { PageHeading } from '@/components/page-heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { type Column, DataTable } from '@/components/ui/data-table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

type Log = {
    id: number;
    action: string;
    entity_type: string;
    entity_id: string | null;
    old_values: Record<string, unknown> | null;
    new_values: Record<string, unknown> | null;
    ip_address: string | null;
    created_at: string;
    actor: { name: string; email: string } | null;
};

type Page<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
};

export default function Audit({
    logs,
    filters,
}: {
    logs: Page<Log>;
    filters: { search?: string };
}) {
    const [selected, setSelected] = useState<Log | null>(null);

    const getActionBadgeVariant = (action: string) => {
        switch (action) {
            case 'create':
                return 'secondary';
            case 'update':
            case 'permission-change':
                return 'outline';
            case 'delete':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    const columns: Column<Log>[] = [
        {
            header: 'Waktu',
            className:
                'text-xs text-muted-foreground whitespace-nowrap tabular-nums',
            cell: (log) =>
                new Date(log.created_at).toLocaleString('id-ID', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                }),
        },
        {
            header: 'Aktor',
            cell: (log) => (
                <div className="min-w-[140px]">
                    <p className="font-medium text-foreground">
                        {log.actor?.name ?? 'Sistem'}
                    </p>
                    {log.actor?.email && (
                        <p className="text-xs text-muted-foreground">
                            {log.actor.email}
                        </p>
                    )}
                </div>
            ),
        },
        {
            header: 'Entitas',
            className: 'text-sm font-mono',
            cell: (log) => (
                <span className="text-xs">
                    {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}
                </span>
            ),
        },
        {
            header: 'Aksi',
            cell: (log) => (
                <Badge
                    variant={getActionBadgeVariant(log.action)}
                    className="font-mono text-xs capitalize"
                >
                    {log.action}
                </Badge>
            ),
        },
        {
            header: 'IP Address',
            className:
                'hidden md:table-cell font-mono text-xs text-muted-foreground',
            cell: (log) => log.ip_address ?? '—',
        },
        {
            header: <span className="sr-only">Detail</span>,
            className: 'text-right whitespace-nowrap',
            cell: (log) => (
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setSelected(log)}
                >
                    <Eye className="size-3.5" />
                    Detail
                </Button>
            ),
        },
    ];

    return (
        <>
            <Head title="Audit Log" />
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
                <PageHeading title="Audit Log" />

                <Card>
                    <CardContent className="flex items-center gap-3 p-3.5">
                        <form
                            className="relative max-w-md flex-1"
                            onSubmit={(e) => {
                                e.preventDefault();
                                router.get(
                                    '/administration/audit',
                                    {
                                        search: (
                                            e.currentTarget.elements.namedItem(
                                                'search',
                                            ) as HTMLInputElement
                                        ).value,
                                    },
                                    { preserveState: true },
                                );
                            }}
                        >
                            <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
                            <Input
                                name="search"
                                defaultValue={filters.search}
                                className="h-9 pl-9 text-sm"
                                placeholder="Cari aksi atau entitas…"
                            />
                        </form>
                        {filters.search && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 px-2.5 text-muted-foreground"
                                onClick={() =>
                                    router.get('/administration/audit')
                                }
                                title="Reset pencarian"
                            >
                                <RotateCcw className="size-4" />
                            </Button>
                        )}
                    </CardContent>
                </Card>

                <DataTable
                    data={logs.data}
                    columns={columns}
                    keyExtractor={(log) => log.id}
                    paginationLinks={logs.links}
                    emptyTitle="Audit log masih kosong"
                    emptyDescription="Belum ada aktivitas tercatat."
                />

                <Dialog
                    open={Boolean(selected)}
                    onOpenChange={(open) => !open && setSelected(null)}
                >
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <span>Detail Audit:</span>
                                <Badge
                                    variant="outline"
                                    className="font-mono text-xs"
                                >
                                    {selected?.entity_type} #
                                    {selected?.entity_id}
                                </Badge>
                            </DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-3 text-sm">
                            <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                                <span>
                                    <strong className="text-foreground">
                                        Aktor:
                                    </strong>{' '}
                                    {selected?.actor?.name ?? 'Sistem'} (
                                    {selected?.actor?.email ?? 'N/A'})
                                </span>
                                <span>
                                    <strong className="text-foreground">
                                        Aksi:
                                    </strong>{' '}
                                    {selected?.action}
                                </span>
                                <span>
                                    <strong className="text-foreground">
                                        IP:
                                    </strong>{' '}
                                    {selected?.ip_address ?? '—'}
                                </span>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                    <p className="mb-1 text-xs font-semibold text-muted-foreground">
                                        Sebelum
                                    </p>
                                    <pre className="max-h-64 overflow-auto rounded-lg border bg-muted/20 p-3 font-mono text-xs">
                                        {selected?.old_values
                                            ? JSON.stringify(
                                                  selected.old_values,
                                                  null,
                                                  2,
                                              )
                                            : '—'}
                                    </pre>
                                </div>
                                <div>
                                    <p className="mb-1 text-xs font-semibold text-muted-foreground">
                                        Sesudah
                                    </p>
                                    <pre className="max-h-64 overflow-auto rounded-lg border bg-muted/20 p-3 font-mono text-xs">
                                        {selected?.new_values
                                            ? JSON.stringify(
                                                  selected.new_values,
                                                  null,
                                                  2,
                                              )
                                            : '—'}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

Audit.layout = {
    breadcrumbs: [
        { title: 'Administrasi', href: '/administration/users' },
        { title: 'Audit Log', href: '/administration/audit' },
    ],
};
