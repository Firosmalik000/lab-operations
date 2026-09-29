import { Head, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { PageHeading } from '@/components/page-heading';
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
    default_unit: Unit | null;
    laboratories: { id: number }[];
};
type Lab = { id: number; name: string };
type Location = { id: number; laboratory_id: number | null; name: string };
const labels: Record<string, string> = {
    OPENING: 'Stok Awal',
    RECEIVING: 'Penerimaan',
    ADJUSTMENT_IN: 'Penyesuaian Masuk',
    ADJUSTMENT_OUT: 'Penyesuaian Keluar',
};
export default function InventoryCreate({
    type,
    laboratories,
    items,
    units,
    locations,
}: {
    type: string;
    laboratories: Lab[];
    items: Item[];
    units: Unit[];
    locations: Location[];
}) {
    const form = useForm({
        type,
        laboratory_id:
            laboratories.length === 1
                ? laboratories[0].id
                : (null as number | null),
        item_id: null as number | null,
        storage_location_id: null as number | null,
        quantity: '',
        unit_id: null as number | null,
        notes: '',
    });
    const errors = form.errors as Record<string, string>;
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/inventory/movements');
    };
    return (
        <>
            <Head title={labels[type]} />
            <form
                onSubmit={submit}
                className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-6 lg:p-8"
            >
                <PageHeading
                    title={labels[type]}
                    description="Setiap perubahan disimpan sebagai pergerakan yang dapat ditelusuri."
                />
                <Card>
                    <CardHeader>
                        <CardTitle>Detail Pergerakan</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-5 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label>Laboratorium</Label>
                            <Select
                                value={
                                    form.data.laboratory_id
                                        ? String(form.data.laboratory_id)
                                        : ''
                                }
                                onValueChange={(v) =>
                                    form.setData((data) => ({
                                        ...data,
                                        laboratory_id: Number(v),
                                        item_id: null,
                                        storage_location_id: null,
                                        unit_id: null,
                                    }))
                                }
                            >
                                <SelectTrigger>
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
                        <div className="grid gap-2">
                            <Label>Item STOCK</Label>
                            <Select
                                onValueChange={(v) => {
                                    const item = items.find(
                                        (entry) => entry.id === Number(v),
                                    );
                                    form.setData((data) => ({
                                        ...data,
                                        item_id: Number(v),
                                        unit_id: item?.default_unit?.id ?? null,
                                    }));
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih item" />
                                </SelectTrigger>
                                <SelectContent>
                                    {items
                                        .filter(
                                            (item) =>
                                                form.data.laboratory_id &&
                                                item.laboratories.some(
                                                    (lab) =>
                                                        lab.id ===
                                                        form.data.laboratory_id,
                                                ),
                                        )
                                        .map((item) => (
                                            <SelectItem
                                                key={item.id}
                                                value={String(item.id)}
                                            >
                                                {item.name} ({item.code})
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.item_id} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="quantity">Jumlah</Label>
                            <Input
                                id="quantity"
                                type="number"
                                inputMode="decimal"
                                min="0.0001"
                                step="any"
                                value={form.data.quantity}
                                onChange={(e) =>
                                    form.setData('quantity', e.target.value)
                                }
                            />
                            <InputError message={errors.quantity} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Satuan</Label>
                            <Select
                                value={
                                    form.data.unit_id
                                        ? String(form.data.unit_id)
                                        : ''
                                }
                                onValueChange={(v) =>
                                    form.setData('unit_id', Number(v))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih satuan" />
                                </SelectTrigger>
                                <SelectContent>
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
                            <InputError message={errors.unit_id} />
                        </div>
                        <div className="grid gap-2 sm:col-span-2">
                            <Label>Lokasi Penyimpanan</Label>
                            <Select
                                value={
                                    form.data.storage_location_id
                                        ? String(form.data.storage_location_id)
                                        : 'none'
                                }
                                onValueChange={(v) =>
                                    form.setData(
                                        'storage_location_id',
                                        v === 'none' ? null : Number(v),
                                    )
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">
                                        Tidak ditentukan
                                    </SelectItem>
                                    {locations
                                        .filter(
                                            (location) =>
                                                !location.laboratory_id ||
                                                location.laboratory_id ===
                                                    form.data.laboratory_id,
                                        )
                                        .map((location) => (
                                            <SelectItem
                                                key={location.id}
                                                value={String(location.id)}
                                            >
                                                {location.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2 sm:col-span-2">
                            <Label htmlFor="movement-notes">
                                Alasan / Catatan{' '}
                                {type.startsWith('ADJUSTMENT') && '*'}
                            </Label>
                            <textarea
                                id="movement-notes"
                                value={form.data.notes}
                                onChange={(e) =>
                                    form.setData('notes', e.target.value)
                                }
                                className="min-h-28 rounded-md border bg-transparent px-3 py-2 text-sm"
                            />
                            <InputError message={errors.notes} />
                        </div>
                    </CardContent>
                </Card>
                <div className="flex justify-end gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => history.back()}
                    >
                        Batal
                    </Button>
                    <Button type="submit" disabled={form.processing}>
                        {form.processing
                            ? 'Menyimpan…'
                            : `Simpan ${labels[type]}`}
                    </Button>
                </div>
            </form>
        </>
    );
}
InventoryCreate.layout = {
    breadcrumbs: [
        { title: 'Inventory', href: '/inventory/stock' },
        { title: 'Catat Pergerakan', href: '#' },
    ],
};
