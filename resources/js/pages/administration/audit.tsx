import { Head, router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import { PageHeading } from '@/components/page-heading';
import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
    return (
        <>
            <Head title="Audit Log" />
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
                <PageHeading
                    title="Audit Log"
                    description="Jejak perubahan penting, termasuk aktor, entitas, nilai sebelum, dan nilai sesudah."
                />
                <Card>
                    <CardContent className="p-4">
                        <form
                            className="relative max-w-md"
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
                            <Search className="absolute top-3 left-3 size-4 text-muted-foreground" />
                            <Input
                                name="search"
                                defaultValue={filters.search}
                                className="pl-9"
                                placeholder="Cari aksi atau entitas…"
                            />
                        </form>
                    </CardContent>
                </Card>
                {logs.data.length === 0 ? (
                    <EmptyState title="Audit log masih kosong" />
                ) : (
                    <>
                        <div className="grid gap-3">
                            {logs.data.map((log) => (
                                <button
                                    key={log.id}
                                    type="button"
                                    onClick={() => setSelected(log)}
                                    className="rounded-xl border bg-card p-4 text-left transition-colors hover:bg-muted/40"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <p className="font-medium">
                                                {log.actor?.name ?? 'Sistem'}{' '}
                                                <span className="font-normal text-muted-foreground">
                                                    {log.action}
                                                </span>{' '}
                                                {log.entity_type} #
                                                {log.entity_id}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(
                                                    log.created_at,
                                                ).toLocaleString('id-ID')}{' '}
                                                ·{' '}
                                                {log.ip_address ??
                                                    'IP tidak tersedia'}
                                            </p>
                                        </div>
                                        <Badge variant="outline">
                                            {log.action}
                                        </Badge>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <Pagination links={logs.links} />
                    </>
                )}
                <Dialog
                    open={Boolean(selected)}
                    onOpenChange={(open) => !open && setSelected(null)}
                >
                    <DialogContent className="sm:max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>Detail Perubahan</DialogTitle>
                            <DialogDescription>
                                {selected?.entity_type} #{selected?.entity_id}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <h3 className="mb-2 text-sm font-medium">
                                    Sebelum
                                </h3>
                                <pre className="max-h-80 overflow-auto rounded-lg bg-muted p-3 text-xs">
                                    {JSON.stringify(
                                        selected?.old_values,
                                        null,
                                        2,
                                    ) || '—'}
                                </pre>
                            </div>
                            <div>
                                <h3 className="mb-2 text-sm font-medium">
                                    Sesudah
                                </h3>
                                <pre className="max-h-80 overflow-auto rounded-lg bg-muted p-3 text-xs">
                                    {JSON.stringify(
                                        selected?.new_values,
                                        null,
                                        2,
                                    ) || '—'}
                                </pre>
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
