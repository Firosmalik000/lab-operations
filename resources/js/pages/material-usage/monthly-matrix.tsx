import { router } from '@inertiajs/react';
import {
    Calendar,
    Download,
    FlaskConical,
    ShieldAlert,
    ShieldCheck,
    Wrench,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export type MatrixRow = {
    no: number;
    id: number;
    code: string;
    name: string;
    type: string;
    category: string;
    unit: string;
    notes: string | null;
    total_masuk: number;
    daily: Record<number, number | null>;
    total_keluar: number;
    stock_akhir: number;
    stock_fisik: number;
    minimum_stock: number;
    status: 'AMAN' | 'KRITIS';
    is_expired: boolean;
};

export type MatrixData = {
    laboratory: { id: number; name: string; code: string };
    period: {
        year: number;
        month: number;
        month_name: string;
        days_in_month: number;
        start_date: string;
        end_date: string;
    };
    category_group: 'bahan' | 'alat';
    officer_name: string;
    approver?: {
        name: string;
        title: string;
    };
    rows: MatrixRow[];
    summary: {
        total_items: number;
        total_keluar_all: number;
    };
};

const MONTH_NAMES = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' },
];

export function MonthlyMatrixView({
    matrix,
    laboratories,
    filters,
}: {
    matrix: MatrixData;
    laboratories: { id: number; name: string }[];
    filters: Record<string, string | number>;
}) {
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1];

    const changeMatrixFilter = (data: Record<string, string | number>) => {
        router.get(
            '/material-usages',
            {
                ...filters,
                view: 'matrix',
                ...data,
            },
            { preserveState: true, replace: true },
        );
    };

    const days = Array.from(
        { length: matrix.period.days_in_month },
        (_, i) => i + 1,
    );

    const exportUrl = `/material-usages/export-monthly?laboratory_id=${matrix.laboratory.id}&year=${matrix.period.year}&month=${matrix.period.month}&category_group=${matrix.category_group}`;

    return (
        <div className="flex flex-col gap-4">
            {/* Sheet Tabs & Controls Header */}
            <Card className="border shadow-xs">
                <CardHeader className="p-4 pb-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        {/* Tab Switcher Bahan vs Alat (seperti tab sheet Excel) */}
                        <div className="flex items-center gap-1 rounded-lg border bg-muted/60 p-1">
                            <button
                                type="button"
                                onClick={() =>
                                    changeMatrixFilter({
                                        matrix_category_group: 'bahan',
                                    })
                                }
                                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                                    matrix.category_group === 'bahan'
                                        ? 'bg-background text-foreground shadow-xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <FlaskConical className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>Bahan Kimia & Media</span>
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    changeMatrixFilter({
                                        matrix_category_group: 'alat',
                                    })
                                }
                                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                                    matrix.category_group === 'alat'
                                        ? 'bg-background text-foreground shadow-xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <Wrench className="size-3.5 text-blue-600 dark:text-blue-400" />
                                <span>Alat & Consumable</span>
                            </button>
                        </div>

                        {/* Export & Actions */}
                        <div className="flex items-center gap-2">
                            <Button
                                asChild
                                size="sm"
                                className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                <a href={`${exportUrl}&format=xlsx`}>
                                    <Download className="size-3.5" />
                                    Download Excel (.xlsx)
                                </a>
                            </Button>
                            <Button
                                asChild
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1.5 text-xs"
                            >
                                <a href={`${exportUrl}&format=csv`}>
                                    <Download className="size-3.5" />
                                    CSV
                                </a>
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="grid gap-3 border-t p-4 sm:grid-cols-3 lg:grid-cols-4">
                    {/* Lab Selector */}
                    <div>
                        <span className="text-xs font-medium text-muted-foreground">
                            Laboratorium
                        </span>
                        <Select
                            value={String(matrix.laboratory.id)}
                            onValueChange={(val) =>
                                changeMatrixFilter({
                                    matrix_laboratory_id: Number(val),
                                })
                            }
                        >
                            <SelectTrigger className="mt-1 h-9 text-xs">
                                <SelectValue placeholder="Pilih Lab" />
                            </SelectTrigger>
                            <SelectContent>
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
                    </div>

                    {/* Month Selector */}
                    <div>
                        <span className="text-xs font-medium text-muted-foreground">
                            Bulan
                        </span>
                        <Select
                            value={String(matrix.period.month)}
                            onValueChange={(val) =>
                                changeMatrixFilter({
                                    matrix_month: Number(val),
                                })
                            }
                        >
                            <SelectTrigger className="mt-1 h-9 text-xs">
                                <SelectValue placeholder="Bulan" />
                            </SelectTrigger>
                            <SelectContent>
                                {MONTH_NAMES.map((m) => (
                                    <SelectItem
                                        key={m.value}
                                        value={String(m.value)}
                                    >
                                        {m.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Year Selector */}
                    <div>
                        <span className="text-xs font-medium text-muted-foreground">
                            Tahun
                        </span>
                        <Select
                            value={String(matrix.period.year)}
                            onValueChange={(val) =>
                                changeMatrixFilter({
                                    matrix_year: Number(val),
                                })
                            }
                        >
                            <SelectTrigger className="mt-1 h-9 text-xs">
                                <SelectValue placeholder="Tahun" />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map((y) => (
                                    <SelectItem key={y} value={String(y)}>
                                        {y}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Analis / Metadata */}
                    <div className="flex flex-col justify-center rounded-lg bg-muted/40 px-3 py-1.5 text-xs">
                        <span className="text-muted-foreground">
                            Petugas / Analis:
                        </span>
                        <span className="font-semibold text-foreground truncate">
                            {matrix.officer_name}
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Document Header Template (Mirip Persis Format Dokumen Excel) */}
            <div className="rounded-xl border bg-card p-5 shadow-xs">
                <div className="border-b pb-3 text-center">
                    <h2 className="text-base font-bold tracking-wider uppercase text-foreground">
                        {matrix.category_group === 'alat'
                            ? 'STOCK OPNAME ALAT & CONSUMABLE'
                            : 'STOCK OPNAME BAHAN KIMIA'}
                    </h2>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2 lg:grid-cols-12">
                    <div className="lg:col-span-6 space-y-1.5">
                        <div className="flex items-center">
                            <span className="w-28 text-muted-foreground font-medium">Lokasi</span>
                            <span className="font-semibold text-foreground">: {matrix.laboratory.name}</span>
                        </div>
                        <div className="flex items-center">
                            <span className="w-28 text-muted-foreground font-medium">Tanggal S.O</span>
                            <span className="font-semibold text-foreground">: {matrix.period.days_in_month} {matrix.period.month_name} {matrix.period.year}</span>
                        </div>
                    </div>
                    <div className="lg:col-span-6 space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between sm:justify-start sm:gap-4">
                            <div className="flex items-center">
                                <span className="w-28 text-muted-foreground font-medium">Nama Petugas</span>
                                <span className="font-semibold text-foreground">: {matrix.officer_name}</span>
                            </div>
                            <span className="text-muted-foreground text-[11px]">(Jabatan/Paraf: Analis)</span>
                        </div>
                        <div className="flex flex-wrap items-center justify-between sm:justify-start sm:gap-4">
                            <div className="flex items-center">
                                <span className="w-28 text-muted-foreground font-medium">Disetujui Oleh</span>
                                <span className="font-semibold text-foreground">: {matrix.approver?.name || 'Aisyatul Faizah'}</span>
                            </div>
                            <span className="text-muted-foreground text-[11px]">(Jabatan/Paraf: {matrix.approver?.title || `Penyelia ${matrix.laboratory.name}`})</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Spreadsheet Matrix Table */}
            <div className="overflow-hidden rounded-xl border border-slate-300 dark:border-slate-700 bg-card shadow-sm">
                <div className="overflow-x-auto max-h-[680px]">
                    <table className="w-full border-collapse text-left text-xs border border-slate-300 dark:border-slate-700">
                        <thead className="sticky top-0 z-20 bg-[#1b365d] text-white font-semibold">
                            <tr className="border-b border-slate-400/30">
                                <th
                                    rowSpan={2}
                                    className="w-10 border-r border-slate-400/30 px-2 py-2 text-center"
                                >
                                    No.
                                </th>
                                <th
                                    rowSpan={2}
                                    className="min-w-[100px] border-r border-slate-400/30 px-3 py-2"
                                >
                                    Kode
                                </th>
                                <th
                                    rowSpan={2}
                                    className="min-w-[120px] border-r border-slate-400/30 px-3 py-2"
                                >
                                    CAS / Catalog No.
                                </th>
                                <th
                                    rowSpan={2}
                                    className="min-w-[220px] border-r border-slate-400/30 px-3 py-2 sticky left-0 z-30 bg-[#1b365d] text-white"
                                >
                                    Nama Bahan
                                </th>
                                <th
                                    rowSpan={2}
                                    className="min-w-[90px] border-r border-slate-400/30 px-2 py-2 text-center"
                                >
                                    Rumus
                                </th>
                                <th
                                    rowSpan={2}
                                    className="w-16 border-r border-slate-400/30 px-2 py-2 text-center"
                                >
                                    Volume
                                </th>
                                <th
                                    rowSpan={2}
                                    className="w-16 border-r border-slate-400/30 px-2 py-2 text-center"
                                >
                                    Satuan
                                </th>
                                <th
                                    rowSpan={2}
                                    className="w-20 border-r border-slate-400/30 px-2 py-2 text-right font-bold"
                                >
                                    Total Masuk
                                </th>
                                <th
                                    colSpan={days.length}
                                    className="border-b border-r border-slate-400/30 py-1 text-center font-bold tracking-wider"
                                >
                                    tanggal
                                </th>
                                <th
                                    rowSpan={2}
                                    className="w-20 border-r border-slate-400/30 px-2 py-2 text-right font-bold"
                                >
                                    Total Keluar
                                </th>
                                <th
                                    rowSpan={2}
                                    className="w-20 border-r border-slate-400/30 px-2 py-2 text-right font-bold"
                                >
                                    Stock Akhir
                                </th>
                                <th
                                    rowSpan={2}
                                    className="w-20 border-r border-slate-400/30 px-2 py-2 text-right"
                                >
                                    Stock Fisik
                                </th>
                                <th
                                    rowSpan={2}
                                    className="w-20 border-r border-slate-400/30 px-2 py-2 text-right"
                                >
                                    Minimum Stock
                                </th>
                                <th
                                    rowSpan={2}
                                    className="w-20 px-2.5 py-2 text-center"
                                >
                                    Status
                                </th>
                            </tr>
                            <tr className="border-b border-slate-400/30 text-[11px]">
                                {days.map((day) => (
                                    <th
                                        key={day}
                                        className="w-8 border-r border-slate-400/30 px-1 py-1 text-center font-mono tabular-nums text-slate-200"
                                    >
                                        {day}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {matrix.rows.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={days.length + 12}
                                        className="py-12 text-center text-muted-foreground"
                                    >
                                        Tidak ada item bahan/alat yang terdaftar
                                        pada laboratorium ini.
                                    </td>
                                </tr>
                            ) : (
                                matrix.rows.map((row) => {
                                    const rowBg = row.is_expired
                                        ? 'bg-rose-500/20 text-rose-950 dark:text-rose-200'
                                        : row.total_keluar > 0
                                          ? 'bg-yellow-200/70 hover:bg-yellow-200/90 text-foreground dark:bg-yellow-500/20'
                                          : 'hover:bg-slate-50 dark:hover:bg-slate-900';

                                    return (
                                        <tr
                                            key={row.id}
                                            className={`transition-colors border-b border-slate-200 dark:border-slate-800 ${rowBg}`}
                                        >
                                            <td className="border-r border-slate-200 dark:border-slate-800 px-2 py-1 text-center font-mono text-muted-foreground tabular-nums">
                                                {row.no}
                                            </td>
                                            <td className="border-r border-slate-200 dark:border-slate-800 px-2 py-1 font-mono text-muted-foreground whitespace-nowrap">
                                                —
                                            </td>
                                            <td className="border-r border-slate-200 dark:border-slate-800 px-2.5 py-1 font-mono text-foreground whitespace-nowrap">
                                                {row.code}
                                            </td>
                                            <td className="border-r border-slate-200 dark:border-slate-800 px-3 py-1 font-medium whitespace-nowrap sticky left-0 z-10 bg-inherit">
                                                <span>{row.name}</span>
                                                {row.is_expired && (
                                                    <span className="ml-2 inline-flex items-center text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                                        (EXPIRED)
                                                    </span>
                                                )}
                                            </td>
                                            <td className="border-r border-slate-200 dark:border-slate-800 px-2 py-1 text-center text-muted-foreground whitespace-nowrap">
                                                —
                                            </td>
                                            <td className="border-r border-slate-200 dark:border-slate-800 px-2 py-1 text-center text-muted-foreground">
                                                {row.notes ?? '—'}
                                            </td>
                                            <td className="border-r border-slate-200 dark:border-slate-800 px-2 py-1 text-center text-muted-foreground">
                                                {row.unit}
                                            </td>
                                            <td className="border-r border-slate-200 dark:border-slate-800 px-2 py-1 text-right font-semibold tabular-nums">
                                                {row.total_masuk || '0'}
                                            </td>

                                            {/* Kolom Tanggal 1..31 */}
                                            {days.map((day) => {
                                                const val = row.daily[day];
                                                return (
                                                    <td
                                                        key={day}
                                                        className={`border-r border-slate-200 dark:border-slate-800 px-1 py-1 text-center font-mono tabular-nums ${
                                                            val
                                                                ? 'font-bold text-foreground bg-amber-500/10'
                                                                : 'text-muted-foreground/30'
                                                        }`}
                                                    >
                                                        {val ?? ''}
                                                    </td>
                                                );
                                            })}

                                            <td className="border-r border-slate-200 dark:border-slate-800 px-2 py-1 text-right font-bold tabular-nums text-foreground">
                                                {row.total_keluar > 0
                                                    ? row.total_keluar
                                                    : '0'}
                                            </td>
                                            <td className="border-r border-slate-200 dark:border-slate-800 px-2 py-1 text-right font-semibold tabular-nums text-foreground">
                                                {row.stock_akhir}
                                            </td>
                                            <td className="border-r border-slate-200 dark:border-slate-800 px-2 py-1 text-right font-medium tabular-nums text-muted-foreground">
                                                {row.stock_fisik}
                                            </td>
                                            <td className="border-r border-slate-200 dark:border-slate-800 px-2 py-1 text-right text-muted-foreground tabular-nums">
                                                {row.minimum_stock || '—'}
                                            </td>
                                            <td className="px-2 py-1 text-center whitespace-nowrap">
                                                {row.status === 'AMAN' ? (
                                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                        AMAN
                                                    </span>
                                                ) : (
                                                    <span className="font-semibold text-rose-600 dark:text-rose-400">
                                                        KRITIS
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Legend matching Excel */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-t bg-muted/30 p-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <span className="size-3 rounded-xs bg-rose-500/40 border border-rose-500" />
                            <span>Reagen Expired / Kadaluarsa</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="size-3 rounded-xs bg-amber-500/30 border border-amber-500" />
                            <span>Stok Di Bawah Minimum (Kritis)</span>
                        </div>
                    </div>

                    <div className="font-medium text-foreground">
                        Total Pemakaian Bulan Ini:{' '}
                        <span className="font-bold tabular-nums">
                            {matrix.summary.total_keluar_all}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
