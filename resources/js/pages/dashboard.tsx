import { Head, Link } from '@inertiajs/react';
import {
    Boxes,
    ClipboardCheck,
    FlaskConical,
    Plus,
    TriangleAlert,
} from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { PageHeading } from '@/components/page-heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Usage = {
    id: number;
    number: string;
    usage_date: string;
    status: string;
    items_count: number;
    laboratory: { name: string };
    creator: { name: string };
};

export default function Dashboard({
    metrics,
    recent,
    can,
}: {
    metrics: {
        transactions_today: number;
        items_today: number;
        my_transactions_today: number;
        low_stock: number;
    };
    recent: Usage[];
    can: { create_usage: boolean; view_inventory: boolean };
}) {
    const cards = [
        ['Transaksi hari ini', metrics.transactions_today, ClipboardCheck],
        ['Item dicatat hari ini', metrics.items_today, FlaskConical],
        ['Penggunaan saya', metrics.my_transactions_today, Boxes],
        ['Stok perlu perhatian', metrics.low_stock, TriangleAlert],
    ] as const;

    return (
        <>
            <Head title="Dashboard" />
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
                <PageHeading
                    title="Dashboard Laboratorium"
                    actions={
                        can.create_usage && (
                            <Button asChild size="sm" className="gap-1.5">
                                <Link href="/material-usages/create">
                                    <Plus className="size-4" />
                                    Catat Penggunaan
                                </Link>
                            </Button>
                        )
                    }
                />

                <section
                    aria-label="Ringkasan"
                    className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
                >
                    {cards.map(([label, value, Icon]) => (
                        <Card key={label} className="border bg-card shadow-xs">
                            <CardContent className="flex items-center justify-between p-5">
                                <div>
                                    <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                        {label}
                                    </p>
                                    <p className="mt-1.5 text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">
                                        {value}
                                    </p>
                                </div>
                                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <Icon className="size-5" />
                                </span>
                            </CardContent>
                        </Card>
                    ))}
                </section>

                <Card className="border bg-card shadow-xs">
                    <CardHeader className="flex-row items-center justify-between border-b pb-4">
                        <CardTitle className="text-base font-semibold">
                            Riwayat Terbaru
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="text-xs"
                        >
                            <Link href="/material-usages">Lihat semua</Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        {recent.length === 0 ? (
                            <div className="py-10">
                                <EmptyState
                                    title="Belum ada transaksi"
                                    description="Transaksi penggunaan bahan terbaru akan tampil di sini."
                                />
                            </div>
                        ) : (
                            <div className="divide-y divide-border/60">
                                {recent.map((usage) => (
                                    <Link
                                        key={usage.id}
                                        href={`/material-usages/${usage.id}`}
                                        className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/40"
                                    >
                                        <div className="min-w-0">
                                            <p className="font-semibold text-primary">
                                                {usage.number}
                                            </p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                {usage.laboratory.name} ·{' '}
                                                {usage.creator.name} ·{' '}
                                                {usage.items_count} item ·{' '}
                                                {usage.usage_date}
                                            </p>
                                        </div>
                                        <Badge
                                            variant={
                                                usage.status === 'VOIDED'
                                                    ? 'destructive'
                                                    : usage.status === 'DRAFT'
                                                      ? 'outline'
                                                      : 'secondary'
                                            }
                                            className="text-xs"
                                        >
                                            {usage.status}
                                        </Badge>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: '/dashboard' }],
};
