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

type Option = { id: number; name: string };
type Unit = Option & { symbol: string };
type Item = {
    id: number;
    code: string;
    name: string;
    item_type_id: number;
    category_id: number | null;
    default_unit_id: number | null;
    inventory_mode: string;
    minimum_stock: string | null;
    is_active: boolean;
    notes: string | null;
    item_type: Option;
    category: Option | null;
    default_unit: Unit | null;
    laboratories: Option[];
};

type Page<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
};

export default function Items({
    items,
    filters,
    itemTypes,
    categories,
    units,
    laboratories,
    can,
}: {
    items: Page<Item>;
    filters: Record<string, string>;
    itemTypes: Option[];
    categories: (Option & { item_type_id: number })[];
    units: Unit[];
    laboratories: Option[];
    can: { create: boolean; update: boolean; delete: boolean };
}) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Item | null>(null);
    const [deletingItem, setDeletingItem] = useState<Item | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const form = useForm({
        code: '',
        name: '',
        item_type_id: null as number | null,
        category_id: null as number | null,
        default_unit_id: null as number | null,
        inventory_mode: 'NONE',
        minimum_stock: '',
        is_active: true,
        notes: '',
        laboratory_ids: [] as number[],
    });

    const show = (item?: Item) => {
        const value = item ?? null;
        setEditing(value);
        form.setData({
            code: value?.code ?? '',
            name: value?.name ?? '',
            item_type_id: value?.item_type_id ?? null,
            category_id: value?.category_id ?? null,
            default_unit_id: value?.default_unit_id ?? null,
            inventory_mode: value?.inventory_mode ?? 'NONE',
            minimum_stock: value?.minimum_stock ?? '',
            is_active: value?.is_active ?? true,
            notes: value?.notes ?? '',
            laboratory_ids: value?.laboratories.map((lab) => lab.id) ?? [],
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
        if (editing) form.put(`/master/items/${editing.id}`, options);
        else form.post('/master/items', options);
    };

    const confirmDelete = () => {
        if (!deletingItem) return;
        setIsDeleting(true);
        router.delete(`/master/items/${deletingItem.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeletingItem(null),
            onFinish: () => setIsDeleting(false),
        });
    };

    const hasFilters = Boolean(
        filters.search || filters.item_type_id || filters.inventory_mode,
    );

    const columns: Column<Item>[] = [
        {
            header: 'Item',
            cell: (item) => (
                <div className="min-w-[160px]">
                    <p className="font-semibold text-foreground">{item.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                        {item.code}
                    </p>
                </div>
            ),
        },
        {
            header: 'Jenis & Kategori',
            className: 'hidden sm:table-cell',
            cell: (item) => (
                <div className="text-sm">
                    <p className="text-foreground">{item.item_type?.name}</p>
                    {item.category && (
                        <p className="text-xs text-muted-foreground">
                            {item.category.name}
                        </p>
                    )}
                </div>
            ),
        },
        {
            header: 'Mode / Satuan',
            className: 'hidden md:table-cell',
            cell: (item) => (
                <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className="font-mono text-[11px]">
                        {item.inventory_mode}
                    </Badge>
                    {item.default_unit && (
                        <span className="text-xs text-muted-foreground">
                            ({item.default_unit.symbol})
                        </span>
                    )}
                </div>
            ),
        },
        {
            header: 'Laboratorium',
            className: 'hidden lg:table-cell max-w-[200px]',
            cell: (item) => (
                <p
                    className="truncate text-xs text-muted-foreground"
                    title={item.laboratories.map((l) => l.name).join(', ')}
                >
                    {item.laboratories.length > 0
                        ? item.laboratories.map((l) => l.name).join(', ')
                        : '—'}
                </p>
            ),
        },
        {
            header: 'Status',
            cell: (item) => (
                <Badge
                    variant={item.is_active ? 'secondary' : 'outline'}
                    className="text-xs"
                >
                    {item.is_active ? 'Aktif' : 'Nonaktif'}
                </Badge>
            ),
        },
        {
            header: <span className="sr-only">Aksi</span>,
            className: 'text-right whitespace-nowrap',
            cell: (item) => (
                <div className="flex items-center justify-end gap-1">
                    {can.update && (
                        <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-muted-foreground hover:text-foreground"
                            onClick={() => show(item)}
                            title="Edit Item"
                        >
                            <Pencil className="size-3.5" />
                        </Button>
                    )}
                    {can.delete && (
                        <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeletingItem(item)}
                            title="Hapus Item"
                        >
                            <Trash2 className="size-3.5" />
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <>
            <Head title="Master Item" />
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
                <PageHeading
                    title="Master Item"
                    actions={
                        can.create && (
                            <Button
                                onClick={() => show()}
                                size="sm"
                                className="gap-1.5"
                            >
                                <Plus className="size-4" />
                                Tambah Item
                            </Button>
                        )
                    }
                />

                <Card>
                    <CardContent className="grid gap-3 p-3.5 sm:grid-cols-[1fr_200px_180px_auto]">
                        <form
                            className="relative"
                            onSubmit={(e) => {
                                e.preventDefault();
                                router.get(
                                    '/master/items',
                                    {
                                        ...filters,
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
                                placeholder="Cari kode atau nama item…"
                            />
                        </form>
                        <Select
                            value={filters.item_type_id || 'all'}
                            onValueChange={(v) =>
                                router.get(
                                    '/master/items',
                                    {
                                        ...filters,
                                        item_type_id: v === 'all' ? '' : v,
                                    },
                                    { preserveState: true },
                                )
                            }
                        >
                            <SelectTrigger className="h-9 text-sm">
                                <SelectValue placeholder="Semua jenis" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua jenis</SelectItem>
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
                        <Select
                            value={filters.inventory_mode || 'all'}
                            onValueChange={(v) =>
                                router.get(
                                    '/master/items',
                                    {
                                        ...filters,
                                        inventory_mode: v === 'all' ? '' : v,
                                    },
                                    { preserveState: true },
                                )
                            }
                        >
                            <SelectTrigger className="h-9 text-sm">
                                <SelectValue placeholder="Semua mode" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua mode</SelectItem>
                                {['NONE', 'STOCK', 'ASSET'].map((mode) => (
                                    <SelectItem key={mode} value={mode}>
                                        {mode}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {hasFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 px-2.5 text-muted-foreground"
                                onClick={() => router.get('/master/items')}
                                title="Reset filter"
                            >
                                <RotateCcw className="size-4" />
                            </Button>
                        )}
                    </CardContent>
                </Card>

                <DataTable
                    data={items.data}
                    columns={columns}
                    keyExtractor={(item) => item.id}
                    paginationLinks={items.links}
                    emptyTitle="Tidak ada item"
                    emptyDescription="Ubah filter pencarian atau buat item baru."
                />

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
                        <form onSubmit={submit}>
                            <DialogHeader>
                                <DialogTitle>
                                    {editing ? 'Edit Item' : 'Tambah Item'}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="my-4 grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="item-code">Kode Item</Label>
                                    <Input
                                        id="item-code"
                                        value={form.data.code}
                                        onChange={(e) =>
                                            form.setData('code', e.target.value)
                                        }
                                        placeholder="cth. ITM-001"
                                    />
                                    <InputError message={form.errors.code} />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="item-name">Nama Item</Label>
                                    <Input
                                        id="item-name"
                                        value={form.data.name}
                                        onChange={(e) =>
                                            form.setData('name', e.target.value)
                                        }
                                        placeholder="cth. Nutrient Agar"
                                    />
                                    <InputError message={form.errors.name} />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label>Jenis Item</Label>
                                    <Select
                                        value={
                                            form.data.item_type_id
                                                ? String(form.data.item_type_id)
                                                : ''
                                        }
                                        onValueChange={(v) =>
                                            form.setData((data) => ({
                                                ...data,
                                                item_type_id: Number(v),
                                                category_id: null,
                                            }))
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
                                </div>
                                <div className="grid gap-1.5">
                                    <Label>Kategori</Label>
                                    <Select
                                        value={
                                            form.data.category_id
                                                ? String(form.data.category_id)
                                                : 'none'
                                        }
                                        onValueChange={(v) =>
                                            form.setData(
                                                'category_id',
                                                v === 'none' ? null : Number(v),
                                            )
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih kategori" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">
                                                Tanpa kategori
                                            </SelectItem>
                                            {categories
                                                .filter(
                                                    (c) =>
                                                        c.item_type_id ===
                                                        form.data.item_type_id,
                                                )
                                                .map((c) => (
                                                    <SelectItem
                                                        key={c.id}
                                                        value={String(c.id)}
                                                    >
                                                        {c.name}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-1.5">
                                    <Label>Mode Inventory</Label>
                                    <Select
                                        value={form.data.inventory_mode}
                                        onValueChange={(v) =>
                                            form.setData('inventory_mode', v)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {['NONE', 'STOCK', 'ASSET'].map(
                                                (mode) => (
                                                    <SelectItem
                                                        key={mode}
                                                        value={mode}
                                                    >
                                                        {mode}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-1.5">
                                    <Label>Satuan Default</Label>
                                    <Select
                                        value={
                                            form.data.default_unit_id
                                                ? String(
                                                      form.data.default_unit_id,
                                                  )
                                                : 'none'
                                        }
                                        onValueChange={(v) =>
                                            form.setData(
                                                'default_unit_id',
                                                v === 'none' ? null : Number(v),
                                            )
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih satuan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">
                                                Belum ditentukan
                                            </SelectItem>
                                            {units.map((unit) => (
                                                <SelectItem
                                                    key={unit.id}
                                                    value={String(unit.id)}
                                                >
                                                    {unit.name} ({unit.symbol})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {form.data.inventory_mode === 'STOCK' && (
                                    <div className="grid gap-1.5 sm:col-span-2">
                                        <Label htmlFor="item-min-stock">
                                            Stok Minimum
                                        </Label>
                                        <Input
                                            id="item-min-stock"
                                            type="number"
                                            min="0"
                                            step="any"
                                            value={form.data.minimum_stock}
                                            onChange={(e) =>
                                                form.setData(
                                                    'minimum_stock',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="0"
                                        />
                                        <InputError
                                            message={form.errors.minimum_stock}
                                        />
                                    </div>
                                )}
                                <fieldset className="grid gap-2 sm:col-span-2">
                                    <legend className="text-sm font-medium">
                                        Laboratorium
                                    </legend>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {laboratories.map((lab) => (
                                            <label
                                                key={lab.id}
                                                className="flex min-h-10 items-center gap-2.5 rounded-lg border px-3 text-sm transition-colors hover:bg-muted/30"
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-input text-primary focus:ring-primary"
                                                    checked={form.data.laboratory_ids.includes(
                                                        lab.id,
                                                    )}
                                                    onChange={(e) =>
                                                        form.setData(
                                                            'laboratory_ids',
                                                            e.target.checked
                                                                ? [
                                                                      ...form
                                                                          .data
                                                                          .laboratory_ids,
                                                                      lab.id,
                                                                  ]
                                                                : form.data.laboratory_ids.filter(
                                                                      (id) =>
                                                                          id !==
                                                                          lab.id,
                                                                  ),
                                                        )
                                                    }
                                                />
                                                {lab.name}
                                            </label>
                                        ))}
                                    </div>
                                    <InputError
                                        message={form.errors.laboratory_ids}
                                    />
                                </fieldset>
                                <label className="flex min-h-10 items-center gap-2.5 rounded-lg border px-3 text-sm transition-colors hover:bg-muted/30 sm:col-span-2">
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
                                    Simpan Item
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <ConfirmDeleteDialog
                    open={Boolean(deletingItem)}
                    onOpenChange={(v) => !v && setDeletingItem(null)}
                    itemName={deletingItem?.name}
                    loading={isDeleting}
                    onConfirm={confirmDelete}
                />
            </div>
        </>
    );
}

Items.layout = {
    breadcrumbs: [
        { title: 'Master Data', href: '/master/items' },
        { title: 'Item', href: '/master/items' },
    ],
};
