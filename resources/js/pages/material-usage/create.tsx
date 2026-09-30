import { Head, useForm } from '@inertiajs/react';
import {
    Check,
    ChevronsUpDown,
    Plus,
    Search,
    Trash2,
    TriangleAlert,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import InputError from '@/components/input-error';
import { PageHeading } from '@/components/page-heading';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type Unit = { id: number; name: string; symbol: string };
type Item = {
    id: number;
    code: string;
    name: string;
    inventory_mode: 'NONE' | 'STOCK' | 'ASSET';
    current_stock: string | null;
    category: { name: string } | null;
    item_type: { name: string };
    default_unit: Unit | null;
};
type Line = {
    item_id: number;
    item: Item;
    quantity: string;
    unit_id: number | null;
    notes: string;
};

function ItemSearch({
    laboratoryId,
    selectedIds,
    onSelect,
}: {
    laboratoryId: number | null;
    selectedIds: number[];
    onSelect: (item: Item) => void;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const container = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!open || !laboratoryId) return;
        const controller = new AbortController();
        const timer = window.setTimeout(async () => {
            setLoading(true);
            try {
                const response = await fetch(
                    `/material-usages/items?laboratory_id=${laboratoryId}&search=${encodeURIComponent(search)}`,
                    {
                        signal: controller.signal,
                        headers: { Accept: 'application/json' },
                    },
                );
                if (response.ok) setItems((await response.json()) as Item[]);
                else setItems([]);
            } catch (error) {
                if (
                    !(
                        error instanceof DOMException &&
                        error.name === 'AbortError'
                    )
                )
                    setItems([]);
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }, 200);
        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [laboratoryId, open, search]);
    useEffect(() => setActiveIndex(0), [items, search]);
    useEffect(() => {
        const close = (event: MouseEvent) => {
            if (!container.current?.contains(event.target as Node))
                setOpen(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    return (
        <div ref={container} className="relative">
            <Button
                type="button"
                variant="outline"
                className="min-h-11 w-full justify-between"
                disabled={!laboratoryId}
                aria-expanded={open}
                aria-haspopup="listbox"
                onClick={() => setOpen((value) => !value)}
            >
                <span className="flex items-center gap-2">
                    <Plus className="size-4" aria-hidden="true" />
                    Tambah Bahan
                </span>
                <ChevronsUpDown
                    className="size-4 opacity-60"
                    aria-hidden="true"
                />
            </Button>
            {open && (
                <div className="absolute z-30 mt-2 w-full rounded-xl border bg-popover p-2 text-popover-foreground shadow-xl">
                    <div className="relative">
                        <Search
                            className="absolute top-3 left-3 size-4 text-muted-foreground"
                            aria-hidden="true"
                        />
                        <Input
                            autoFocus
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                            placeholder="Cari nama atau kode item…"
                            aria-label="Cari item"
                            aria-controls="item-search-results"
                            aria-activedescendant={
                                items[activeIndex]
                                    ? `item-option-${items[activeIndex].id}`
                                    : undefined
                            }
                            onKeyDown={(event) => {
                                if (event.key === 'ArrowDown') {
                                    event.preventDefault();
                                    setActiveIndex((index) =>
                                        Math.min(index + 1, items.length - 1),
                                    );
                                } else if (event.key === 'ArrowUp') {
                                    event.preventDefault();
                                    setActiveIndex((index) =>
                                        Math.max(index - 1, 0),
                                    );
                                } else if (
                                    event.key === 'Enter' &&
                                    items[activeIndex] &&
                                    !selectedIds.includes(items[activeIndex].id)
                                ) {
                                    event.preventDefault();
                                    onSelect(items[activeIndex]);
                                    setOpen(false);
                                    setSearch('');
                                } else if (event.key === 'Escape') {
                                    setOpen(false);
                                }
                            }}
                        />
                    </div>
                    <div
                        role="listbox"
                        id="item-search-results"
                        className="mt-2 max-h-72 overflow-y-auto"
                    >
                        {loading ? (
                            <p className="p-4 text-center text-sm text-muted-foreground">
                                Mencari item…
                            </p>
                        ) : items.length === 0 ? (
                            <p className="p-4 text-center text-sm text-muted-foreground">
                                Item tidak ditemukan.
                            </p>
                        ) : (
                            items.map((item) => {
                                const selected = selectedIds.includes(item.id);
                                return (
                                    <button
                                        key={item.id}
                                        id={`item-option-${item.id}`}
                                        type="button"
                                        role="option"
                                        aria-selected={selected}
                                        disabled={selected}
                                        onClick={() => {
                                            onSelect(item);
                                            setOpen(false);
                                            setSearch('');
                                        }}
                                        className={`flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-accent disabled:opacity-50 ${activeIndex === items.indexOf(item) ? 'bg-accent' : ''}`}
                                    >
                                        <Check
                                            className={`size-4 shrink-0 ${selected ? 'opacity-100' : 'opacity-0'}`}
                                            aria-hidden="true"
                                        />
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate font-medium">
                                                {item.name}
                                            </span>
                                            <span className="block truncate text-xs text-muted-foreground">
                                                {item.code} ·{' '}
                                                {item.category?.name ??
                                                    item.item_type.name}
                                            </span>
                                        </span>
                                        <Badge variant="outline">
                                            {item.inventory_mode}
                                        </Badge>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

type Draft = {
    id: number;
    usage_date: string;
    purpose: string | null;
    notes: string | null;
    items: Line[];
};

export default function CreateUsage({
    laboratories,
    defaultLaboratoryId,
    units,
    draft,
}: {
    laboratories: { id: number; name: string }[];
    defaultLaboratoryId: number | null;
    units: Unit[];
    draft?: Draft;
}) {
    const [lines, setLines] = useState<Line[]>(draft?.items ?? []);
    const today = new Date();
    const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const form = useForm({
        usage_date: draft?.usage_date ?? localDate,
        laboratory_id: defaultLaboratoryId,
        purpose: draft?.purpose ?? '',
        notes: draft?.notes ?? '',
        status: draft ? 'DRAFT' : 'SUBMITTED',
        items: (draft?.items ?? []).map(
            ({ item_id, quantity, unit_id, notes }) => ({
                item_id,
                quantity,
                unit_id,
                notes: notes ?? '',
            }),
        ),
    });
    const errors = form.errors as Record<string, string>;
    const sync = (next: Line[]) => {
        setLines(next);
        form.setData(
            'items',
            next.map(({ item_id, quantity, unit_id, notes }) => ({
                item_id,
                quantity,
                unit_id,
                notes,
            })),
        );
    };
    const add = (item: Item) =>
        sync([
            ...lines,
            {
                item_id: item.id,
                item,
                quantity: '',
                unit_id: item.default_unit?.id ?? null,
                notes: '',
            },
        ]);
    const update = (index: number, values: Partial<Line>) =>
        sync(
            lines.map((line, lineIndex) =>
                lineIndex === index ? { ...line, ...values } : line,
            ),
        );
    const warningCount = useMemo(
        () =>
            lines.filter(
                (line) =>
                    line.item.inventory_mode === 'STOCK' &&
                    line.item.current_stock !== null &&
                    Number(line.quantity) > Number(line.item.current_stock),
            ).length,
        [lines],
    );
    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        if (draft)
            form.put(`/material-usages/${draft.id}`, { preserveScroll: true });
        else form.post('/material-usages', { preserveScroll: true });
    };

    return (
        <>
            <Head title="Catat Penggunaan Bahan" />
            <form
                onSubmit={submit}
                className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 pb-28 sm:p-6 lg:p-8 lg:pb-8"
            >
                <PageHeading
                    title={
                        draft
                            ? 'Ubah Draft Penggunaan'
                            : 'Catat Penggunaan Bahan'
                    }
                />
                <div className="grid max-w-xs gap-1.5">
                    <Label>Status</Label>
                    <Select
                        value={form.data.status}
                        onValueChange={(value) => form.setData('status', value)}
                    >
                        <SelectTrigger className="h-9 text-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="DRAFT">
                                Draft (Belum Kurangi Stok)
                            </SelectItem>
                            <SelectItem value="SUBMITTED">
                                Submit (Potong Stok)
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <InputError message={errors.status} />
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Penggunaan</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-5 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="usage_date">
                                Tanggal Penggunaan
                            </Label>
                            <Input
                                id="usage_date"
                                type="date"
                                value={form.data.usage_date}
                                onChange={(e) =>
                                    form.setData('usage_date', e.target.value)
                                }
                                aria-invalid={Boolean(errors.usage_date)}
                            />
                            <InputError message={errors.usage_date} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Laboratorium</Label>
                            <Select
                                value={
                                    form.data.laboratory_id
                                        ? String(form.data.laboratory_id)
                                        : ''
                                }
                                onValueChange={(value) => {
                                    form.setData(
                                        'laboratory_id',
                                        Number(value),
                                    );
                                    sync([]);
                                }}
                            >
                                <SelectTrigger
                                    aria-invalid={Boolean(errors.laboratory_id)}
                                >
                                    <SelectValue placeholder="Pilih laboratorium" />
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
                            <InputError message={errors.laboratory_id} />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label htmlFor="purpose">
                                Keperluan / Keterangan
                            </Label>
                            <Input
                                id="purpose"
                                value={form.data.purpose}
                                onChange={(e) =>
                                    form.setData('purpose', e.target.value)
                                }
                                placeholder="Contoh: Pengujian sampel air batch September"
                            />
                            <InputError message={errors.purpose} />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label htmlFor="notes">Catatan</Label>
                            <textarea
                                id="notes"
                                value={form.data.notes}
                                onChange={(e) =>
                                    form.setData('notes', e.target.value)
                                }
                                className="min-h-24 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:ring-2"
                                placeholder="Opsional"
                            />
                            <InputError message={errors.notes} />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Bahan yang Digunakan</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ItemSearch
                            laboratoryId={form.data.laboratory_id}
                            selectedIds={lines.map((line) => line.item_id)}
                            onSelect={add}
                        />
                        <InputError message={errors.items} />
                        {warningCount > 0 && (
                            <Alert>
                                <TriangleAlert aria-hidden="true" />
                                <AlertTitle>
                                    Stok tercatat tidak mencukupi
                                </AlertTitle>
                                <AlertDescription>
                                    Jumlah penggunaan melebihi stok yang
                                    tercatat. Anda tetap dapat melanjutkan
                                    transaksi.
                                </AlertDescription>
                            </Alert>
                        )}
                        {lines.length === 0 ? (
                            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                                Belum ada bahan. Gunakan tombol Tambah Bahan
                                untuk mulai.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {lines.map((line, index) => {
                                    const low =
                                        line.item.inventory_mode === 'STOCK' &&
                                        line.item.current_stock !== null &&
                                        Number(line.quantity) >
                                            Number(line.item.current_stock);
                                    return (
                                        <div
                                            key={line.item_id}
                                            className="rounded-xl border bg-card p-4"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <h3 className="font-medium">
                                                        {line.item.name}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {line.item.code} ·{' '}
                                                        {line.item.category
                                                            ?.name ??
                                                            line.item.item_type
                                                                .name}
                                                    </p>
                                                </div>
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    aria-label={`Hapus ${line.item.name}`}
                                                    onClick={() =>
                                                        sync(
                                                            lines.filter(
                                                                (_, i) =>
                                                                    i !== index,
                                                            ),
                                                        )
                                                    }
                                                >
                                                    <Trash2
                                                        className="size-4"
                                                        aria-hidden="true"
                                                    />
                                                </Button>
                                            </div>
                                            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_2fr]">
                                                <div className="grid gap-2">
                                                    <Label
                                                        htmlFor={`quantity-${index}`}
                                                    >
                                                        Jumlah
                                                    </Label>
                                                    <Input
                                                        id={`quantity-${index}`}
                                                        inputMode="decimal"
                                                        type="number"
                                                        min="0.01"
                                                        step="0.01"
                                                        value={line.quantity}
                                                        onChange={(e) => {
                                                            const val =
                                                                e.target.value;
                                                            if (
                                                                val === '' ||
                                                                /^\d*(\.\d{0,2})?$/.test(
                                                                    val,
                                                                )
                                                            ) {
                                                                update(index, {
                                                                    quantity:
                                                                        val,
                                                                });
                                                            }
                                                        }}
                                                        placeholder="0.00"
                                                        aria-invalid={Boolean(
                                                            errors[
                                                                `items.${index}.quantity`
                                                            ],
                                                        )}
                                                    />
                                                    <InputError
                                                        message={
                                                            errors[
                                                                `items.${index}.quantity`
                                                            ]
                                                        }
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label>Satuan</Label>
                                                    <Select
                                                        value={
                                                            line.unit_id
                                                                ? String(
                                                                      line.unit_id,
                                                                  )
                                                                : ''
                                                        }
                                                        onValueChange={(
                                                            value,
                                                        ) =>
                                                            update(index, {
                                                                unit_id:
                                                                    Number(
                                                                        value,
                                                                    ),
                                                            })
                                                        }
                                                    >
                                                        <SelectTrigger
                                                            aria-invalid={Boolean(
                                                                errors[
                                                                    `items.${index}.unit_id`
                                                                ],
                                                            )}
                                                        >
                                                            <SelectValue placeholder="Pilih satuan" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {units.map(
                                                                (unit) => (
                                                                    <SelectItem
                                                                        key={
                                                                            unit.id
                                                                        }
                                                                        value={String(
                                                                            unit.id,
                                                                        )}
                                                                    >
                                                                        {
                                                                            unit.name
                                                                        }{' '}
                                                                        (
                                                                        {
                                                                            unit.symbol
                                                                        }
                                                                        )
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                    <InputError
                                                        message={
                                                            errors[
                                                                `items.${index}.unit_id`
                                                            ]
                                                        }
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label
                                                        htmlFor={`notes-${index}`}
                                                    >
                                                        Catatan item
                                                    </Label>
                                                    <Input
                                                        id={`notes-${index}`}
                                                        value={line.notes}
                                                        onChange={(e) =>
                                                            update(index, {
                                                                notes: e.target
                                                                    .value,
                                                            })
                                                        }
                                                        placeholder="Opsional"
                                                    />
                                                </div>
                                            </div>
                                            {low && (
                                                <p className="mt-3 flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                                                    <TriangleAlert
                                                        className="size-4"
                                                        aria-hidden="true"
                                                    />
                                                    Jumlah penggunaan melebihi
                                                    stok yang tercatat (
                                                    {line.item.current_stock}).
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
                <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 p-3 backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:p-0">
                    <div className="mx-auto flex max-w-5xl justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => history.back()}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            size="lg"
                            disabled={form.processing || lines.length === 0}
                        >
                            {form.processing
                                ? 'Menyimpan…'
                                : 'Simpan Penggunaan'}
                        </Button>
                    </div>
                </div>
            </form>
        </>
    );
}

CreateUsage.layout = {
    breadcrumbs: [
        { title: 'Penggunaan Bahan', href: '/material-usages' },
        { title: 'Catat', href: '/material-usages/create' },
    ],
};
