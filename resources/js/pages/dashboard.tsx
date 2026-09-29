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
                    description="Ringkasan aktivitas operasional yang paling relevan untuk Anda."
                    actions={
                        can.create_usage && (
                            <Button asChild size="lg">
                                <Link href="/material-usages/create">
                                    <Plus aria-hidden="true" />
                                    Catat Penggunaan
                                </Link>
                            </Button>
                        )
                    }
                />
                <section
                    aria-label="Ringkasan"
                    className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
                >
                    {cards.map(([label, value, Icon]) => (
                        <Card key={label}>
                            <CardContent className="flex items-center justify-between p-5">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        {label}
                                    </p>
                                    <p className="mt-1 text-3xl font-semibold tabular-nums">
                                        {value}
                                    </p>
                                </div>
                                <span className="rounded-xl bg-primary/10 p-3 text-primary">
                                    <Icon
                                        className="size-5"
                                        aria-hidden="true"
                                    />
                                </span>
                            </CardContent>
                        </Card>
                    ))}
                </section>
                <Card>
                    <CardHeader className="flex-row items-center justify-between">
                        <CardTitle>Riwayat terbaru</CardTitle>
                        <Button variant="ghost" asChild>
                            <Link href="/material-usages">Lihat semua</Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {recent.length === 0 ? (
                            <EmptyState
                                title="Belum ada penggunaan"
                                description="Catat transaksi pertama untuk mulai membangun riwayat laboratorium."
                            />
                        ) : (
                            <div className="divide-y">
                                {recent.map((usage) => (
                                    <Link
                                        key={usage.id}
                                        href={`/material-usages/${usage.id}`}
                                        className="flex min-h-16 items-center justify-between gap-4 rounded-lg px-2 py-3 transition-colors hover:bg-muted/60"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate font-medium">
                                                {usage.number}
                                            </p>
                                            <p className="truncate text-sm text-muted-foreground">
                                                {usage.laboratory.name} ·{' '}
                                                {usage.creator.name} ·{' '}
                                                {usage.items_count} item
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
