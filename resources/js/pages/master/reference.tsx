import { Head, router, useForm } from '@inertiajs/react';
import { Pencil, Plus, RotateCcw, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import InputError from '@/components/input-error';
import { PageHeading } from '@/components/page-heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { type Column, DataTable } from '@/components/ui/data-table';
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
    const [deletingRecord, setDeletingRecord] = useState<RecordItem | null>(
        null,
    );
    const [isDeleting, setIsDeleting] = useState(false);

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

    const confirmDelete = () => {
        if (!deletingRecord) return;
        setIsDeleting(true);
        router.delete(`/master/${resource}/${deletingRecord.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeletingRecord(null),
            onFinish: () => setIsDeleting(false),
        });
    };

    const columns: Column<RecordItem>[] = [
        {
            header: 'Nama',
            cell: (record) => (
                <div>
                    <p className="font-semibold text-foreground">
                        {record.name}
                    </p>
                    {record.code && (
                        <p className="font-mono text-xs text-muted-foreground sm:hidden">
                            {record.code}
                        </p>
                    )}
                </div>
            ),
        },
        ...(resource === 'laboratories' || resource === 'storage-locations'
            ? [
                  {
                      header: 'Kode',
                      className: 'hidden sm:table-cell font-mono text-xs',
                      cell: (record: RecordItem) => record.code || '—',
                  },
              ]
            : []),
        ...(resource === 'units'
            ? [
                  {
                      header: 'Simbol',
                      className: 'font-mono text-xs',
                      cell: (record: RecordItem) => (
                          <Badge
                              variant="outline"
                              className="font-mono text-xs"
                          >
                              {record.symbol}
                          </Badge>
                      ),
                  },
              ]
            : []),
        ...(resource === 'categories'
            ? [
                  {
                      header: 'Jenis Item',
                      className:
                          'hidden sm:table-cell text-sm text-muted-foreground',
                      cell: (record: RecordItem) =>
                          record.item_type?.name ?? '—',
                  },
              ]
            : []),
        ...(resource === 'storage-locations'
            ? [
                  {
                      header: 'Laboratorium',
                      className:
                          'hidden sm:table-cell text-sm text-muted-foreground',
                      cell: (record: RecordItem) =>
                          record.laboratory?.name ?? 'Semua',
                  },
              ]
            : []),
        {
            header: 'Status',
            cell: (record) => (
                <Badge
                    variant={record.is_active ? 'secondary' : 'outline'}
                    className="text-xs"
                >
                    {record.is_active ? 'Aktif' : 'Nonaktif'}
                </Badge>
            ),
        },
        {
            header: <span className="sr-only">Aksi</span>,
            className: 'text-right whitespace-nowrap',
            cell: (record) => (
                <div className="flex items-center justify-end gap-1">
                    <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-muted-foreground hover:text-foreground"
                        aria-label={`Edit ${record.name}`}
                        onClick={() => show(record)}
                        title={`Edit ${label}`}
                    >
                        <Pencil className="size-3.5" />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        aria-label={`Hapus ${record.name}`}
                        onClick={() => setDeletingRecord(record)}
                        title={`Hapus ${label}`}
                    >
                        <Trash2 className="size-3.5" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <Head title={label} />
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
                <PageHeading
                    title={label}
                    actions={
                        <Button
                            onClick={() => show()}
                            size="sm"
                            className="gap-1.5"
                        >
                            <Plus className="size-4" />
                            Tambah {label}
                        </Button>
                    }
                />

                <Card>
                    <CardContent className="flex items-center gap-3 p-3.5">
                        <form
                            className="relative max-w-md flex-1"
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
                            <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
                            <Input
                                name="search"
                                defaultValue={filters.search}
                                className="h-9 pl-9 text-sm"
                                placeholder={`Cari ${label.toLowerCase()}…`}
                            />
                        </form>
                        {filters.search && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 px-2.5 text-muted-foreground"
                                onClick={() =>
                                    router.get(`/master/${resource}`)
                                }
                                title="Reset pencarian"
                            >
                                <RotateCcw className="size-4" />
                            </Button>
                        )}
                    </CardContent>
                </Card>

                <DataTable
                    data={records.data}
                    columns={columns}
                    keyExtractor={(record) => record.id}
                    paginationLinks={records.links}
                    emptyTitle={`${label} belum tersedia`}
                    emptyDescription={`Belum ada data ${label.toLowerCase()} yang tercatat.`}
                />

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent className="sm:max-w-md">
                        <form onSubmit={submit}>
                            <DialogHeader>
                                <DialogTitle>
                                    {editing ? 'Edit' : 'Tambah'} {label}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="my-4 grid gap-4">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="reference-name">Nama</Label>
                                    <Input
                                        id="reference-name"
                                        value={form.data.name}
                                        onChange={(e) =>
                                            form.setData('name', e.target.value)
                                        }
                                        placeholder={`Nama ${label.toLowerCase()}`}
                                    />
                                    <InputError message={form.errors.name} />
                                </div>
                                {['laboratories', 'storage-locations'].includes(
                                    resource,
                                ) && (
                                    <div className="grid gap-1.5">
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
                                            placeholder="cth. LAB-01"
                                        />
                                        <InputError
                                            message={form.errors.code}
                                        />
                                    </div>
                                )}
                                {resource === 'units' && (
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="reference-symbol">
                                            Simbol Satuan
                                        </Label>
                                        <Input
                                            id="reference-symbol"
                                            value={form.data.symbol}
                                            onChange={(e) =>
                                                form.setData(
                                                    'symbol',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="cth. mL, g, pcs"
                                        />
                                        <InputError
                                            message={form.errors.symbol}
                                        />
                                    </div>
                                )}
                                {resource === 'categories' && (
                                    <div className="grid gap-1.5">
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
                                                <SelectValue placeholder="Pilih jenis item" />
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
                                    <div className="grid gap-1.5">
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
                                                <SelectValue placeholder="Semua laboratorium" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">
                                                    Umum (Semua Laboratorium)
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
                                        <InputError
                                            message={form.errors.laboratory_id}
                                        />
                                    </div>
                                )}
                                <label className="flex min-h-10 items-center gap-2.5 rounded-lg border px-3 text-sm transition-colors hover:bg-muted/30">
                                    <input
                                        type="checkbox"
                                        className="rounded border-input text-primary focus:ring-primary"
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
                            <DialogFooter className="gap-2 sm:gap-0">
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

                <ConfirmDeleteDialog
                    open={Boolean(deletingRecord)}
                    onOpenChange={(v) => !v && setDeletingRecord(null)}
                    itemName={deletingRecord?.name}
                    loading={isDeleting}
                    onConfirm={confirmDelete}
                />
            </div>
        </>
    );
}

Reference.layout = {
    breadcrumbs: [
        { title: 'Master Data', href: '/master/items' },
        { title: 'Referensi', href: '/master/item-types' },
    ],
};
