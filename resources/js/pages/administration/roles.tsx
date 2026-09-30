import { Head, useForm } from '@inertiajs/react';
import { Pencil, Shield, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { PageHeading } from '@/components/page-heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

type Permission = { id: number; name: string; label: string };
type Role = {
    id: number;
    name: string;
    label: string;
    users_count: number;
    permissions: Permission[];
};

export default function Roles({
    roles,
    permissions,
}: {
    roles: Role[];
    permissions: Permission[];
}) {
    const [selected, setSelected] = useState<Role | null>(null);
    const form = useForm({ label: '', permission_ids: [] as number[] });

    const open = (role: Role) => {
        setSelected(role);
        form.setData({
            label: role.label,
            permission_ids: role.permissions.map((p) => p.id),
        });
        form.clearErrors();
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        if (selected)
            form.put(`/administration/roles/${selected.id}`, {
                preserveScroll: true,
                onSuccess: () => setSelected(null),
            });
    };

    const toggle = (id: number, checked: boolean) =>
        form.setData(
            'permission_ids',
            checked
                ? [...form.data.permission_ids, id]
                : form.data.permission_ids.filter((pId) => pId !== id),
        );

    const columns: Column<Role>[] = [
        {
            header: 'Role',
            cell: (role) => (
                <div className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        {role.name === 'super-admin' ? (
                            <ShieldCheck className="size-4.5" />
                        ) : (
                            <Shield className="size-4.5" />
                        )}
                    </span>
                    <div>
                        <p className="font-semibold text-foreground">
                            {role.label}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">
                            {role.name}
                        </p>
                    </div>
                </div>
            ),
        },
        {
            header: 'Pengguna',
            className: 'text-sm whitespace-nowrap',
            cell: (role) => (
                <span className="font-medium text-foreground tabular-nums">
                    {role.users_count} user
                </span>
            ),
        },
        {
            header: 'Hak Akses (Permissions)',
            className: 'hidden md:table-cell max-w-md',
            cell: (role) => (
                <div className="flex flex-wrap items-center gap-1">
                    <Badge variant="secondary" className="text-xs font-medium">
                        {role.permissions.length} akses
                    </Badge>
                    {role.permissions.slice(0, 3).map((p) => (
                        <span
                            key={p.id}
                            className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
                        >
                            {p.name}
                        </span>
                    ))}
                    {role.permissions.length > 3 && (
                        <span className="text-[11px] text-muted-foreground">
                            +{role.permissions.length - 3} lainnya
                        </span>
                    )}
                </div>
            ),
        },
        {
            header: <span className="sr-only">Aksi</span>,
            className: 'text-right whitespace-nowrap',
            cell: (role) => (
                <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 text-xs"
                    disabled={role.name === 'super-admin'}
                    onClick={() => open(role)}
                >
                    <Pencil className="size-3.5" />
                    Ubah Akses
                </Button>
            ),
        },
    ];

    return (
        <>
            <Head title="Role & Permission" />
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
                <PageHeading title="Role & Permission" />

                <DataTable
                    data={roles}
                    columns={columns}
                    keyExtractor={(role) => role.id}
                    emptyTitle="Belum ada role"
                />

                <Dialog
                    open={Boolean(selected)}
                    onOpenChange={(value) => !value && setSelected(null)}
                >
                    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                        <form onSubmit={submit}>
                            <DialogHeader>
                                <DialogTitle>
                                    Ubah Hak Akses: {selected?.label}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="my-4 grid gap-4">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="role-label">
                                        Nama Role
                                    </Label>
                                    <Input
                                        id="role-label"
                                        value={form.data.label}
                                        onChange={(e) =>
                                            form.setData(
                                                'label',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError message={form.errors.label} />
                                </div>
                                <fieldset className="grid gap-2">
                                    <legend className="text-sm font-medium">
                                        Daftar Permission
                                    </legend>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {permissions.map((permission) => (
                                            <label
                                                key={permission.id}
                                                className="flex min-h-11 items-center gap-2.5 rounded-lg border px-3 text-sm transition-colors hover:bg-muted/30"
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-input text-primary focus:ring-primary"
                                                    checked={form.data.permission_ids.includes(
                                                        permission.id,
                                                    )}
                                                    onChange={(e) =>
                                                        toggle(
                                                            permission.id,
                                                            e.target.checked,
                                                        )
                                                    }
                                                />
                                                <div className="min-w-0">
                                                    <span className="block truncate font-medium text-foreground">
                                                        {permission.label}
                                                    </span>
                                                    <span className="block truncate font-mono text-[11px] text-muted-foreground">
                                                        {permission.name}
                                                    </span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                    <InputError
                                        message={form.errors.permission_ids}
                                    />
                                </fieldset>
                            </div>
                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setSelected(null)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={form.processing}
                                >
                                    Simpan Perubahan
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

Roles.layout = {
    breadcrumbs: [
        { title: 'Administrasi', href: '/administration/users' },
        { title: 'Role & Permission', href: '/administration/roles' },
    ],
};
