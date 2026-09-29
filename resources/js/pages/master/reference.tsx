import { Head, router, useForm } from '@inertiajs/react';
import { Pencil, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { EmptyState } from '@/components/empty-state';
import { PageHeading } from '@/components/page-heading';
import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
type RecordItem = {
    id: number;
    name: string;
    code?: string | null;
    symbol?: string;
    is_active: boolean;
    item_type_id?: number;
    laboratory_id?: number | null;
    item_type?: { name: string };
    laboratory?: { name: string };
};
type Page<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
};
export default function Reference({
    resource,
    label,
    records,
    filters,
    itemTypes,
    laboratories,
}: {
    resource: string;
    label: string;
    records: Page<RecordItem>;
    filters: { search?: string };
    itemTypes: { id: number; name: string }[];
    laboratories: { id: number; name: string }[];
}) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<RecordItem | null>(null);
    const form = useForm({
        name: '',
        code: '',
        symbol: '',
        is_active: true,
        item_type_id: null as number | null,
        parent_id: null as number | null,
        laboratory_id: null as number | null,
    });
    const show = (record?: RecordItem) => {
        const value = record ?? null;
        setEditing(value);
        form.setData({
            name: value?.name ?? '',
            code: value?.code ?? '',
            symbol: value?.symbol ?? '',
            is_active: value?.is_active ?? true,
            item_type_id: value?.item_type_id ?? null,
            parent_id: null,
            laboratory_id: value?.laboratory_id ?? null,
        });
        form.clearErrors();
        setOpen(true);
    };
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => setOpen(false),
        };
        if (editing) form.put(`/master/${resource}/${editing.id}`, options);
        else form.post(`/master/${resource}`, options);
    };
    return (
        <>
            <Head title={label} />
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
                <PageHeading
                    title={label}
                    description={`Kelola master data ${label.toLowerCase()} tanpa perubahan kode aplikasi.`}
                    actions={
                        <Button onClick={() => show()}>
                            <Plus />
                            Tambah {label}
                        </Button>
                    }
                />
                <Card>
                    <CardContent className="p-4">
                        <form
                            className="relative max-w-md"
                            onSubmit={(e) => {
                                e.preventDefault();
                                router.get(
                                    `/master/${resource}`,
                                    {
                                        search: (
                                            e.currentTarget.elements.namedItem(
                                                'search',
                                            ) as HTMLInputElement
                                        ).value,
                                    },
                                    { preserveState: true, replace: true },
                                );
                            }}
                        >
                            <Search className="absolute top-3 left-3 size-4 text-muted-foreground" />
                            <Input
                                name="search"
                                defaultValue={filters.search}
                                className="pl-9"
                                placeholder={`Cari ${label.toLowerCase()}…`}
                            />
                        </form>
                    </CardContent>
                </Card>
                {records.data.length === 0 ? (
                    <EmptyState title={`${label} belum tersedia`} />
                ) : (
                    <>
                        <div className="grid gap-3">
                            {records.data.map((record) => (
                                <Card key={record.id}>
                                    <CardContent className="flex items-center justify-between gap-4 p-4">
                                        <div>
                                            <p className="font-medium">
                                                {record.name}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {record.code ||
                                                    record.symbol ||
                                                    record.item_type?.name ||
                                                    record.laboratory?.name ||
                                                    'Master data'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant={
                                                    record.is_active
                                                        ? 'secondary'
                                                        : 'outline'
                                                }
                                            >
                                                {record.is_active
                                                    ? 'Aktif'
                                                    : 'Nonaktif'}
                                            </Badge>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                aria-label={`Edit ${record.name}`}
                                                onClick={() => show(record)}
                                            >
                                                <Pencil className="size-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <Pagination links={records.links} />
                    </>
                )}
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent>
                        <form onSubmit={submit}>
                            <DialogHeader>
                                <DialogTitle>
                                    {editing ? 'Edit' : 'Tambah'} {label}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="my-5 grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="reference-name">Nama</Label>
                                    <Input
                                        id="reference-name"
                                        value={form.data.name}
                                        onChange={(e) =>
                                            form.setData('name', e.target.value)
                                        }
                                    />
                                    <InputError message={form.errors.name} />
                                </div>
                                {['laboratories', 'storage-locations'].includes(
                                    resource,
                                ) && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="reference-code">
                                            Kode
                                        </Label>
                                        <Input
                                            id="reference-code"
                                            value={form.data.code}
                                            onChange={(e) =>
                                                form.setData(
                                                    'code',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={form.errors.code}
                                        />
                                    </div>
                                )}
                                {resource === 'units' && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="symbol">Simbol</Label>
                                        <Input
                                            id="symbol"
                                            value={form.data.symbol}
                                            onChange={(e) =>
                                                form.setData(
                                                    'symbol',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={form.errors.symbol}
                                        />
                                    </div>
                                )}
                                {resource === 'categories' && (
                                    <div className="grid gap-2">
                                        <Label>Jenis Item</Label>
                                        <Select
                                            value={
                                                form.data.item_type_id
                                                    ? String(
                                                          form.data
                                                              .item_type_id,
                                                      )
                                                    : ''
                                            }
                                            onValueChange={(v) =>
                                                form.setData(
                                                    'item_type_id',
                                                    Number(v),
                                                )
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih jenis" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {itemTypes.map((type) => (
                                                    <SelectItem
                                                        key={type.id}
                                                        value={String(type.id)}
                                                    >
                                                        {type.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            message={form.errors.item_type_id}
                                        />
                                    </div>
                                )}
                                {resource === 'storage-locations' && (
                                    <div className="grid gap-2">
                                        <Label>Laboratorium</Label>
                                        <Select
                                            value={
                                                form.data.laboratory_id
                                                    ? String(
                                                          form.data
                                                              .laboratory_id,
                                                      )
                                                    : 'none'
                                            }
                                            onValueChange={(v) =>
                                                form.setData(
                                                    'laboratory_id',
                                                    v === 'none'
                                                        ? null
                                                        : Number(v),
                                                )
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">
                                                    Umum
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
                                    </div>
                                )}
                                <label className="flex min-h-11 items-center gap-3 rounded-lg border px-3">
                                    <input
                                        type="checkbox"
                                        checked={form.data.is_active}
                                        onChange={(e) =>
                                            form.setData(
                                                'is_active',
                                                e.target.checked,
                                            )
                                        }
                                    />
                                    Aktif
                                </label>
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={form.processing}
                                >
                                    Simpan
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
Reference.layout = {
    breadcrumbs: [
        { title: 'Master Data', href: '/master/items' },
        { title: 'Referensi', href: '#' },
    ],
};
