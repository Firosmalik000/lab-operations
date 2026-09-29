import { Head, router } from '@inertiajs/react';
import { Download } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { PageHeading } from '@/components/page-heading';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type Option = { id: number; name: string; code?: string };
type Row = Record<string, string | number | null>;
type Page<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
};

type Props = {
    rows: Page<Row>;
    columns: Record<string, string>;
    reportTypes: Record<string, string>;
    filters: Record<string, string>;
    laboratories: Option[];
    items: Option[];
    categories: Option[];
    users: Option[];
};

export default function Reports({
    rows,
    columns,
    reportTypes,
    filters,
    laboratories,
    items,
    categories,
    users,
}: Props) {
    const apply = (key: string, value: string) =>
        router.get(
            '/reports',
            { ...filters, [key]: value === 'all' ? '' : value },
            { preserveState: true, replace: true },
        );
    const exportUrl = `/reports/export?${new URLSearchParams(filters).toString()}`;
    const type = filters.type || 'usage';
    const dateRelevant = !['current-stock', 'low-stock'].includes(type);
    const userRelevant = !['current-stock', 'low-stock'].includes(type);

    return (
        <>
            <Head title="Laporan" />
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
                <PageHeading
                    title={reportTypes[type] ?? 'Laporan'}
                    description="Tujuh laporan operasional dengan filter sesuai ruang lingkup laboratorium Anda."
                    actions={
                        <Button asChild variant="outline">
                            <a href={exportUrl}>
                                <Download aria-hidden="true" /> Ekspor CSV
                            </a>
                        </Button>
                    }
                />

                <Card>
                    <CardContent className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="grid gap-2 sm:col-span-2">
                            <Label>Jenis laporan</Label>
                            <Select
                                value={type}
                                onValueChange={(value) => apply('type', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(reportTypes).map(
                                        ([value, label]) => (
                                            <SelectItem
                                                key={value}
                                                value={value}
                                            >
                                                {label}
                                            </SelectItem>
                                        ),
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        {dateRelevant && (
                            <>
                                <FilterDate
                                    label="Dari tanggal"
                                    value={filters.date_from}
                                    onChange={(value) =>
                                        apply('date_from', value)
                                    }
                                />
                                <FilterDate
                                    label="Sampai tanggal"
                                    value={filters.date_to}
                                    onChange={(value) =>
                                        apply('date_to', value)
                                    }
                                />
                            </>
                        )}
                        <FilterSelect
                            label="Laboratorium"
                            value={filters.laboratory_id}
                            options={laboratories}
                            onChange={(value) => apply('laboratory_id', value)}
                        />
                        <FilterSelect
                            label="Item"
                            value={filters.item_id}
                            options={items}
                            onChange={(value) => apply('item_id', value)}
                        />
                        <FilterSelect
                            label="Kategori"
                            value={filters.category_id}
                            options={categories}
                            onChange={(value) => apply('category_id', value)}
                        />
                        {userRelevant && (
                            <FilterSelect
                                label="Petugas"
                                value={filters.user_id}
                                options={users}
                                onChange={(value) => apply('user_id', value)}
                            />
                        )}
                    </CardContent>
                </Card>

                {rows.data.length === 0 ? (
                    <EmptyState
                        title="Tidak ada data laporan"
                        description="Sesuaikan rentang tanggal atau filter laporan."
                    />
                ) : (
                    <>
                        <div className="hidden overflow-x-auto rounded-xl border bg-card md:block">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 text-left">
                                    <tr>
                                        {Object.values(columns).map((label) => (
                                            <th key={label} className="p-4">
                                                {label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {rows.data.map((row, index) => (
                                        <tr key={index}>
                                            {Object.keys(columns).map((key) => (
                                                <td key={key} className="p-4">
                                                    {display(row[key])}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="grid gap-3 md:hidden">
                            {rows.data.map((row, index) => (
                                <Card key={index}>
                                    <CardContent className="grid grid-cols-2 gap-3 p-4">
                                        {Object.entries(columns).map(
                                            ([key, label]) => (
                                                <div
                                                    key={key}
                                                    className={
                                                        key === 'item' ||
                                                        key === 'number'
                                                            ? 'col-span-2'
                                                            : ''
                                                    }
                                                >
                                                    <p className="text-xs text-muted-foreground">
                                                        {label}
                                                    </p>
                                                    <p className="mt-1 text-sm font-medium break-words">
                                                        {display(row[key])}
                                                    </p>
                                                </div>
                                            ),
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <Pagination links={rows.links} />
                    </>
                )}
            </div>
        </>
    );
}

function FilterDate({
    label,
    value,
    onChange,
}: {
    label: string;
    value?: string;
    onChange: (value: string) => void;
}) {
    return (
        <div className="grid gap-2">
            <Label>{label}</Label>
            <Input
                type="date"
                value={value ?? ''}
                onChange={(event) => onChange(event.target.value)}
            />
        </div>
    );
}

function FilterSelect({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value?: string;
    options: Option[];
    onChange: (value: string) => void;
}) {
    return (
        <div className="grid gap-2">
            <Label>{label}</Label>
            <Select value={value || 'all'} onValueChange={onChange}>
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    {options.map((option) => (
                        <SelectItem key={option.id} value={String(option.id)}>
                            {option.code ? `${option.code} — ` : ''}
                            {option.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

function display(value: Row[string]) {
    return value === null || value === '' ? '—' : String(value);
}

Reports.layout = { breadcrumbs: [{ title: 'Laporan', href: '/reports' }] };
