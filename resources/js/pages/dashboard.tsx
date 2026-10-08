import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    Boxes,
    CheckCircle2,
    ClipboardCheck,
    Clock,
    FileSpreadsheet,
    FlaskConical,
    Layers,
    Plus,
    TrendingUp,
    XCircle,
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

type TrendPoint = {
    date: string;
    day: string;
    label: string;
    transactions: number;
    quantity: number;
};

type StatusDist = {
    status: string;
    label: string;
    count: number;
    color: string;
};

type StockDist = {
    safe: number;
    low: number;
    empty: number;
    total: number;
};

type DashboardProps = {
    metrics: {
        transactions_today: number;
        transactions_diff: number;
        items_today: number;
        items_diff: number;
        my_transactions_today: number;
        my_transactions_diff: number;
        low_stock: number;
        out_of_stock: number;
    };
    charts: {
        trend: TrendPoint[];
        status_distribution: StatusDist[];
        stock_distribution: StockDist;
    };
    recent: Usage[];
    can: { create_usage: boolean; view_inventory: boolean };
};

export default function Dashboard({
    metrics,
    charts,
    recent,
    can,
}: DashboardProps) {
    const [trendMetric, setTrendMetric] = useState<'transactions' | 'quantity'>(
        'transactions',
    );
    const [activeHoverIdx, setActiveHoverIdx] = useState<number | null>(null);

    // Trend calculations for interactive SVG Bar Chart
    const trendValues = charts.trend.map((d) =>
        trendMetric === 'transactions' ? d.transactions : d.quantity,
    );
    const maxTrendVal = Math.max(...trendValues, 5);

    // Doughnut chart calculations for status
    const totalStatusCount = charts.status_distribution.reduce(
        (acc, item) => acc + item.count,
        0,
    );

    // Calculate conic-gradient segments for SVG doughnut
    let cumulativePercent = 0;
    const doughnutSegments = charts.status_distribution.map((item) => {
        const percent = totalStatusCount > 0 ? (item.count / totalStatusCount) * 100 : 0;
        const start = cumulativePercent;
        cumulativePercent += percent;
        return {
            ...item,
            percent,
            start,
            end: cumulativePercent,
        };
    });

    const kpiCards = [
        {
            title: 'Transaksi Hari Ini',
            value: metrics.transactions_today,
            diff: metrics.transactions_diff,
            unit: 'transaksi',
            icon: ClipboardCheck,
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-500/10',
        },
        {
            title: 'Item Dicatat Hari Ini',
            value: metrics.items_today,
            diff: metrics.items_diff,
            unit: 'item',
            icon: FlaskConical,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-500/10',
        },
        {
            title: 'Penggunaan Saya',
            value: metrics.my_transactions_today,
            diff: metrics.my_transactions_diff,
            unit: 'input',
            icon: Boxes,
            color: 'text-indigo-600 dark:text-indigo-400',
            bg: 'bg-indigo-500/10',
        },
        {
            title: 'Stok Perlu Perhatian',
            value: metrics.low_stock,
            diff: metrics.out_of_stock,
            unit: 'kritis',
            isWarning: true,
            icon: AlertTriangle,
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-500/10',
        },
    ];

    return (
        <>
            <Head title="Dashboard" />
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
                {/* Header with Quick Actions */}
                <PageHeading
                    title="Dashboard Operasional"
                    description="Monitoring performa transaksi, stok laboratorium, dan ringkasan aktivitas terkini."
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            <Button asChild variant="outline" size="sm" className="h-9 gap-1.5 text-xs">
                                <Link href="/material-usages?view=matrix">
                                    <FileSpreadsheet className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                                    Matriks Pemakaian
                                </Link>
                            </Button>
                            {can.create_usage && (
                                <Button asChild size="sm" className="h-9 gap-1.5 text-xs">
                                    <Link href="/material-usages/create">
                                        <Plus className="size-3.5" />
                                        Catat Penggunaan
                                    </Link>
                                </Button>
                            )}
                        </div>
                    }
                />

                {/* KPI Metrics Cards */}
                <section
                    aria-label="Ringkasan Indikator Kinerja"
                    className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
                >
                    {kpiCards.map((kpi) => {
                        const Icon = kpi.icon;
                        const isPositive = kpi.diff > 0;
                        const isZero = kpi.diff === 0;

                        return (
                            <Card key={kpi.title} className="border bg-card shadow-xs transition-shadow hover:shadow-sm">
                                <CardContent className="p-4 sm:p-5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            {kpi.title}
                                        </span>
                                        <span className={`flex size-9 items-center justify-center rounded-xl ${kpi.bg} ${kpi.color}`}>
                                            <Icon className="size-4" />
                                        </span>
                                    </div>

                                    <div className="mt-3 flex items-baseline justify-between">
                                        <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
                                            {kpi.value}
                                        </span>

                                        {kpi.isWarning ? (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                                {kpi.diff} habis
                                            </span>
                                        ) : (
                                            <span
                                                className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                                    isZero
                                                        ? 'bg-muted text-muted-foreground'
                                                        : isPositive
                                                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                                }`}
                                            >
                                                {isZero ? (
                                                    <span>= 0 vs kemarin</span>
                                                ) : isPositive ? (
                                                    <>
                                                        <ArrowUpRight className="size-3" />
                                                        <span>+{kpi.diff} vs kemarin</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <ArrowDownRight className="size-3" />
                                                        <span>{kpi.diff} vs kemarin</span>
                                                    </>
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </section>

                {/* Visual Charts Grid */}
                <div className="grid gap-6 lg:grid-cols-12">
                    {/* Interactive Trend Chart (7 Hari Terakhir) */}
                    <Card className="border bg-card shadow-xs lg:col-span-8">
                        <CardHeader className="flex flex-col gap-2 p-4 pb-2 sm:flex-row sm:items-center sm:justify-between border-b">
                            <div className="flex items-center gap-2">
                                <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <TrendingUp className="size-4" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-semibold">
                                        Tren Aktivitas Pemakaian (7 Hari Terakhir)
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground">
                                        Volume operasional harian laboratorium
                                    </p>
                                </div>
                            </div>

                            {/* Metric Toggle */}
                            <div className="flex rounded-lg border bg-muted/50 p-0.5 text-xs font-medium">
                                <button
                                    type="button"
                                    onClick={() => setTrendMetric('transactions')}
                                    className={`rounded-md px-2.5 py-1 transition-colors ${
                                        trendMetric === 'transactions'
                                            ? 'bg-background text-foreground shadow-xs font-semibold'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Jumlah Transaksi
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTrendMetric('quantity')}
                                    className={`rounded-md px-2.5 py-1 transition-colors ${
                                        trendMetric === 'quantity'
                                            ? 'bg-background text-foreground shadow-xs font-semibold'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Total Qty Bahan
                                </button>
                            </div>
                        </CardHeader>

                        <CardContent className="p-4 sm:p-6">
                            {/* SVG Interactive Bar Chart */}
                            <div className="flex h-56 w-full items-end gap-2 sm:gap-4 pt-4 pb-2">
                                {charts.trend.map((point, idx) => {
                                    const val = trendMetric === 'transactions' ? point.transactions : point.quantity;
                                    const heightPct = maxTrendVal > 0 ? Math.max((val / maxTrendVal) * 100, 4) : 4;
                                    const isHovered = activeHoverIdx === idx;

                                    return (
                                        <div
                                            key={point.date}
                                            className="group relative flex flex-1 flex-col items-center h-full justify-end"
                                            onMouseEnter={() => setActiveHoverIdx(idx)}
                                            onMouseLeave={() => setActiveHoverIdx(null)}
                                        >
                                            {/* Tooltip */}
                                            {isHovered && (
                                                <div className="absolute -top-10 z-30 flex flex-col items-center rounded-md bg-popover px-2.5 py-1 text-[11px] font-semibold text-popover-foreground shadow-md border animate-in fade-in zoom-in-95 pointer-events-none">
                                                    <span>
                                                        {val} {trendMetric === 'transactions' ? 'tx' : 'unit'}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground font-normal">
                                                        {point.label}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Value on top of bar */}
                                            <span className="mb-1.5 text-[11px] font-semibold text-muted-foreground tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">
                                                {val}
                                            </span>

                                            {/* Bar Pill */}
                                            <div className="w-full max-w-[42px] h-full flex items-end">
                                                <div
                                                    style={{ height: `${heightPct}%` }}
                                                    className={`w-full rounded-t-lg transition-all duration-300 ${
                                                        isHovered
                                                            ? 'bg-primary shadow-sm scale-x-105'
                                                            : val > 0
                                                              ? 'bg-primary/80 hover:bg-primary'
                                                              : 'bg-muted/70'
                                                    }`}
                                                />
                                            </div>

                                            {/* Date / Day Label */}
                                            <span className="mt-2.5 text-[11px] font-medium text-muted-foreground">
                                                {point.day}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground/70 font-mono">
                                                {point.label.split(' ')[0]}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                    <span className="size-2.5 rounded-xs bg-primary" />
                                    <span>{trendMetric === 'transactions' ? 'Transaksi terverifikasi' : 'Volume konsumsi bahan'}</span>
                                </span>
                                <span className="font-medium text-foreground">
                                    Total 7 hari:{' '}
                                    <span className="font-bold tabular-nums">
                                        {trendValues.reduce((a, b) => a + b, 0)}{' '}
                                        {trendMetric === 'transactions' ? 'transaksi' : 'unit'}
                                    </span>
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Status & Stock Doughnut/Breakdown */}
                    <Card className="border bg-card shadow-xs lg:col-span-4 flex flex-col justify-between">
                        <CardHeader className="p-4 pb-2 border-b">
                            <div className="flex items-center gap-2">
                                <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    <Layers className="size-4" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-semibold">
                                        Distribusi Status &amp; Stok
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground">
                                        Proporsi operasional laboratorium
                                    </p>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-4 sm:p-5 flex flex-col gap-5 justify-center">
                            {/* Doughnut Chart / Ring Indicator */}
                            <div className="flex items-center gap-4">
                                <div className="relative flex size-28 shrink-0 items-center justify-center">
                                    <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                                        {/* Background Circle */}
                                        <path
                                            className="text-muted/40"
                                            strokeWidth="4"
                                            stroke="currentColor"
                                            fill="none"
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                        {/* Segments */}
                                        {totalStatusCount > 0 ? (
                                            doughnutSegments.map((seg) => (
                                                <path
                                                    key={seg.status}
                                                    stroke={seg.color}
                                                    strokeWidth="4"
                                                    strokeDasharray={`${seg.percent}, 100`}
                                                    strokeDashoffset={`${-seg.start}`}
                                                    strokeLinecap="round"
                                                    fill="none"
                                                    className="transition-all duration-500"
                                                />
                                            ))
                                        ) : (
                                            <path
                                                stroke="#94a3b8"
                                                strokeWidth="4"
                                                strokeDasharray="100, 100"
                                                fill="none"
                                            />
                                        )}
                                    </svg>

                                    <div className="absolute flex flex-col items-center justify-center text-center">
                                        <span className="text-lg font-bold tabular-nums text-foreground">
                                            {totalStatusCount}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                            Total
                                        </span>
                                    </div>
                                </div>

                                {/* Status Legend */}
                                <div className="flex flex-col gap-2 min-w-0 flex-1">
                                    {charts.status_distribution.map((item) => (
                                        <div key={item.status} className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2 truncate">
                                                <span
                                                    className="size-2.5 rounded-full shrink-0"
                                                    style={{ backgroundColor: item.color }}
                                                />
                                                <span className="text-muted-foreground truncate">
                                                    {item.label}
                                                </span>
                                            </div>
                                            <span className="font-semibold text-foreground tabular-nums">
                                                {item.count}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Inventory Health Bar */}
                            <div className="rounded-lg border bg-muted/30 p-3">
                                <div className="flex items-center justify-between text-xs mb-1.5">
                                    <span className="font-medium text-foreground">
                                        Kesehatan Stok Inventaris
                                    </span>
                                    <span className="text-[11px] text-muted-foreground font-mono">
                                        {charts.stock_distribution.total} item
                                    </span>
                                </div>

                                {/* Stacked Progress Bar */}
                                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted flex">
                                    {charts.stock_distribution.total > 0 ? (
                                        <>
                                            <div
                                                style={{
                                                    width: `${(charts.stock_distribution.safe / charts.stock_distribution.total) * 100}%`,
                                                }}
                                                className="bg-emerald-500 transition-all duration-300"
                                                title={`Aman: ${charts.stock_distribution.safe}`}
                                            />
                                            <div
                                                style={{
                                                    width: `${(charts.stock_distribution.low / charts.stock_distribution.total) * 100}%`,
                                                }}
                                                className="bg-amber-500 transition-all duration-300"
                                                title={`Mendekati Minimum: ${charts.stock_distribution.low}`}
                                            />
                                            <div
                                                style={{
                                                    width: `${(charts.stock_distribution.empty / charts.stock_distribution.total) * 100}%`,
                                                }}
                                                className="bg-rose-500 transition-all duration-300"
                                                title={`Habis: ${charts.stock_distribution.empty}`}
                                            />
                                        </>
                                    ) : (
                                        <div className="w-full bg-muted-foreground/20" />
                                    )}
                                </div>

                                <div className="mt-2 grid grid-cols-3 gap-1 text-[11px] text-center">
                                    <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                        <span>Aman:</span>
                                        <span className="font-bold tabular-nums">
                                            {charts.stock_distribution.safe}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                                        <span>Kritis:</span>
                                        <span className="font-bold tabular-nums">
                                            {charts.stock_distribution.low}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                                        <span>Habis:</span>
                                        <span className="font-bold tabular-nums">
                                            {charts.stock_distribution.empty}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Activities Table */}
                <Card className="border bg-card shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between border-b p-4">
                        <div className="flex items-center gap-2">
                            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Activity className="size-4" />
                            </div>
                            <div>
                                <CardTitle className="text-sm font-semibold">
                                    Aktivitas Transaksi Terbaru
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">
                                    Catatan penggunaan bahan terakhir yang terekam
                                </p>
                            </div>
                        </div>

                        <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="text-xs h-8"
                        >
                            <Link href="/material-usages">Lihat semua riwayat</Link>
                        </Button>
                    </CardHeader>

                    <CardContent className="p-0">
                        {recent.length === 0 ? (
                            <div className="py-12">
                                <EmptyState
                                    title="Belum ada transaksi"
                                    description="Transaksi penggunaan bahan terbaru akan tampil otomatis di sini."
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
                                        <div className="min-w-0 flex items-center gap-3">
                                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                                {usage.status === 'SUBMITTED' ? (
                                                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                                                ) : usage.status === 'VOIDED' ? (
                                                    <XCircle className="size-4 text-rose-600 dark:text-rose-400" />
                                                ) : (
                                                    <Clock className="size-4 text-amber-600 dark:text-amber-400" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-sm text-foreground hover:text-primary transition-colors">
                                                    {usage.number}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {usage.laboratory.name} · {usage.creator.name} ·{' '}
                                                    <span className="font-medium text-foreground">
                                                        {usage.items_count} item
                                                    </span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="text-xs text-muted-foreground hidden sm:inline tabular-nums">
                                                {usage.usage_date}
                                            </span>
                                            <Badge
                                                variant={
                                                    usage.status === 'VOIDED'
                                                        ? 'destructive'
                                                        : usage.status === 'DRAFT'
                                                          ? 'outline'
                                                          : 'secondary'
                                                }
                                                className={`text-xs ${
                                                    usage.status === 'SUBMITTED'
                                                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                                        : ''
                                                }`}
                                            >
                                                {usage.status}
                                            </Badge>
                                        </div>
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
