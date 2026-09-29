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
    can: { create: boolean; update: boolean };
}) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Item | null>(null);
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
    return (
        <>
            <Head title="Master Item" />
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
                <PageHeading
                    title="Master Item"
                    description="Item historis dinonaktifkan, bukan dihapus. Mode inventory dapat diaktifkan dari titik waktu baru."
                    actions={
                        can.create && (
                            <Button onClick={() => show()}>
                                <Plus />
                                Tambah Item
                            </Button>
                        )
                    }
                />
                <Card>
                    <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_200px_180px]">
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
                            <Search className="absolute top-3 left-3 size-4 text-muted-foreground" />
                            <Input
                                name="search"
                                defaultValue={filters.search}
                                className="pl-9"
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
                            <SelectTrigger>
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
                            <SelectTrigger>
                                <SelectValue />
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
                    </CardContent>
                </Card>
                {items.data.length === 0 ? (
                    <EmptyState title="Item tidak ditemukan" />
                ) : (
                    <>
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {items.data.map((item) => (
                                <Card key={item.id}>
                                    <CardContent className="p-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate font-semibold">
                                                    {item.name}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {item.code} ·{' '}
                                                    {item.category?.name ??
                                                        item.item_type.name}
                                                </p>
                                            </div>
                                            {can.update && (
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => show(item)}
                                                    aria-label={`Edit ${item.name}`}
                                                >
                                                    <Pencil className="size-4" />
                                                </Button>
                                            )}
                                        </div>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <Badge variant="outline">
                                                {item.inventory_mode}
                                            </Badge>
                                            <Badge
                                                variant={
                                                    item.is_active
                                                        ? 'secondary'
                                                        : 'outline'
                                                }
                                            >
                                                {item.is_active
                                                    ? 'Aktif'
                                                    : 'Nonaktif'}
                                            </Badge>
                                            {item.default_unit && (
                                                <Badge variant="outline">
                                                    {item.default_unit.symbol}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="mt-4 line-clamp-1 text-sm text-muted-foreground">
                                            {item.laboratories
                                                .map((lab) => lab.name)
                                                .join(', ')}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <Pagination links={items.links} />
                    </>
                )}
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                        <form onSubmit={submit}>
                            <DialogHeader>
                                <DialogTitle>
                                    {editing ? 'Edit Item' : 'Tambah Item'}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="my-5 grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label>Kode</Label>
                                    <Input
                                        value={form.data.code}
                                        onChange={(e) =>
                                            form.setData('code', e.target.value)
                                        }
                                    />
                                    <InputError message={form.errors.code} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Nama</Label>
                                    <Input
                                        value={form.data.name}
                                        onChange={(e) =>
                                            form.setData('name', e.target.value)
                                        }
                                    />
                                    <InputError message={form.errors.name} />
                                </div>
                                <div className="grid gap-2">
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
                                <div className="grid gap-2">
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
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">
                                                Tanpa kategori
                                            </SelectItem>
                                            {categories
                                                .filter(
                                                    (category) =>
                                                        category.item_type_id ===
                                                        form.data.item_type_id,
                                                )
                                                .map((category) => (
                                                    <SelectItem
                                                        key={category.id}
                                                        value={String(
                                                            category.id,
                                                        )}
                                                    >
                                                        {category.name}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
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
                                <div className="grid gap-2">
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
                                            <SelectValue />
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
                                    <div className="grid gap-2">
                                        <Label>Stok Minimum</Label>
                                        <Input
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
                                                className="flex min-h-11 items-center gap-3 rounded-lg border px-3"
                                            >
                                                <input
                                                    type="checkbox"
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
                                <label className="flex min-h-11 items-center gap-3 rounded-lg border px-3 sm:col-span-2">
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
                                    Item aktif dan dapat dipilih pada transaksi
                                    baru
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
                                    Simpan Item
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
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
