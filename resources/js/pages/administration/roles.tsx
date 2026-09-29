import { Head, useForm } from '@inertiajs/react';
import { Pencil, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { PageHeading } from '@/components/page-heading';
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
            permission_ids: role.permissions.map((permission) => permission.id),
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
                : form.data.permission_ids.filter(
                      (permissionId) => permissionId !== id,
                  ),
        );

    return (
        <>
            <Head title="Role & Permission" />
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
                <PageHeading
                    title="Role & Permission"
                    description="Atur kemampuan tiap role. Super Admin selalu memiliki seluruh permission dan dikunci untuk mencegah kehilangan akses."
                />
                <div className="grid gap-4 md:grid-cols-2">
                    {roles.map((role) => (
                        <Card key={role.id}>
                            <CardContent className="flex h-full flex-col gap-4 p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h2 className="font-semibold">
                                            {role.label}
                                        </h2>
                                        <p className="text-sm text-muted-foreground">
                                            {role.users_count} user ·{' '}
                                            {role.permissions.length} permission
                                        </p>
                                    </div>
                                    <ShieldCheck
                                        className="size-5 text-primary"
                                        aria-hidden="true"
                                    />
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {role.permissions
                                        .slice(0, 8)
                                        .map((permission) => (
                                            <Badge
                                                key={permission.id}
                                                variant="outline"
                                            >
                                                {permission.name}
                                            </Badge>
                                        ))}
                                    {role.permissions.length > 8 && (
                                        <Badge variant="secondary">
                                            +{role.permissions.length - 8}
                                        </Badge>
                                    )}
                                </div>
                                <Button
                                    className="mt-auto self-start"
                                    variant="outline"
                                    disabled={role.name === 'super-admin'}
                                    onClick={() => open(role)}
                                >
                                    <Pencil aria-hidden="true" /> Ubah
                                    permission
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <Dialog
                    open={Boolean(selected)}
                    onOpenChange={(value) => !value && setSelected(null)}
                >
                    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                        <form onSubmit={submit}>
                            <DialogHeader>
                                <DialogTitle>
                                    Ubah {selected?.label}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="my-5 grid gap-5">
                                <div className="grid gap-2">
                                    <Label htmlFor="role-label">
                                        Nama tampilan
                                    </Label>
                                    <Input
                                        id="role-label"
                                        value={form.data.label}
                                        onChange={(event) =>
                                            form.setData(
                                                'label',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError message={form.errors.label} />
                                </div>
                                <fieldset className="grid gap-2 sm:grid-cols-2">
                                    <legend className="mb-2 text-sm font-medium sm:col-span-2">
                                        Permission
                                    </legend>
                                    {permissions.map((permission) => (
                                        <label
                                            key={permission.id}
                                            className="flex min-h-12 items-start gap-3 rounded-lg border p-3"
                                        >
                                            <input
                                                className="mt-1"
                                                type="checkbox"
                                                checked={form.data.permission_ids.includes(
                                                    permission.id,
                                                )}
                                                onChange={(event) =>
                                                    toggle(
                                                        permission.id,
                                                        event.target.checked,
                                                    )
                                                }
                                            />
                                            <span>
                                                <span className="block text-sm font-medium">
                                                    {permission.label}
                                                </span>
                                                <span className="block text-xs text-muted-foreground">
                                                    {permission.name}
                                                </span>
                                            </span>
                                        </label>
                                    ))}
                                    <InputError
                                        message={form.errors.permission_ids}
                                    />
                                </fieldset>
                            </div>
                            <DialogFooter>
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
                                    Simpan Role
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
