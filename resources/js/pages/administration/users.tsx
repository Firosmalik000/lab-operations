import { Head, useForm } from '@inertiajs/react';
import { Pencil, Plus } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
type Option = { id: number; name: string; label?: string };
type User = {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    default_laboratory_id: number | null;
    roles: Option[];
    laboratories: Option[];
    default_laboratory: Option | null;
};
type Page<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
};
export default function Users({
    users,
    roles,
    laboratories,
}: {
    users: Page<User>;
    roles: Option[];
    laboratories: Option[];
}) {
    const [selected, setSelected] = useState<User | null>(null);
    const [creating, setCreating] = useState(false);
    const createForm = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role_ids: [] as number[],
        laboratory_ids: [] as number[],
        default_laboratory_id: null as number | null,
    });
    const form = useForm({
        role_ids: [] as number[],
        laboratory_ids: [] as number[],
        default_laboratory_id: null as number | null,
        is_active: true,
    });
    const show = (user: User) => {
        setSelected(user);
        form.setData({
            role_ids: user.roles.map((role) => role.id),
            laboratory_ids: user.laboratories.map((lab) => lab.id),
            default_laboratory_id: user.default_laboratory_id,
            is_active: user.is_active,
        });
        form.clearErrors();
    };
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selected)
            form.put(`/administration/users/${selected.id}`, {
                preserveScroll: true,
                onSuccess: () => setSelected(null),
            });
    };
    const submitCreate = (event: React.FormEvent) => {
        event.preventDefault();
        createForm.post('/administration/users', {
            preserveScroll: true,
            onSuccess: () => {
                setCreating(false);
                createForm.reset();
            },
        });
    };
    return (
        <>
            <Head title="User & Akses" />
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
                <PageHeading
                    title="User & Akses"
                    description="Tetapkan role dan ruang lingkup laboratorium. Semua perubahan akses dicatat dalam audit log."
                    actions={
                        <Button onClick={() => setCreating(true)}>
                            <Plus aria-hidden="true" /> Tambah User
                        </Button>
                    }
                />
                {users.data.length === 0 ? (
                    <EmptyState title="Belum ada user" />
                ) : (
                    <>
                        <div className="grid gap-3">
                            {users.data.map((user) => (
                                <Card key={user.id}>
                                    <CardContent className="flex items-center justify-between gap-4 p-4">
                                        <div className="min-w-0">
                                            <p className="truncate font-medium">
                                                {user.name}
                                            </p>
                                            <p className="truncate text-sm text-muted-foreground">
                                                {user.email}
                                            </p>
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {user.roles.map((role) => (
                                                    <Badge
                                                        key={role.id}
                                                        variant="secondary"
                                                    >
                                                        {role.label}
                                                    </Badge>
                                                ))}
                                                {user.laboratories.map(
                                                    (lab) => (
                                                        <Badge
                                                            key={lab.id}
                                                            variant="outline"
                                                        >
                                                            {lab.name}
                                                        </Badge>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant={
                                                    user.is_active
                                                        ? 'secondary'
                                                        : 'destructive'
                                                }
                                            >
                                                {user.is_active
                                                    ? 'Aktif'
                                                    : 'Nonaktif'}
                                            </Badge>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                aria-label={`Edit akses ${user.name}`}
                                                onClick={() => show(user)}
                                            >
                                                <Pencil className="size-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <Pagination links={users.links} />
                    </>
                )}
                <Dialog
                    open={Boolean(selected)}
                    onOpenChange={(open) => !open && setSelected(null)}
                >
                    <DialogContent className="max-h-[90vh] overflow-y-auto">
                        <form onSubmit={submit}>
                            <DialogHeader>
                                <DialogTitle>
                                    Akses {selected?.name}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="my-5 grid gap-5">
                                <fieldset className="grid gap-2">
                                    <legend className="text-sm font-medium">
                                        Role
                                    </legend>
                                    {roles.map((role) => (
                                        <label
                                            key={role.id}
                                            className="flex min-h-11 items-center gap-3 rounded-lg border px-3"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={form.data.role_ids.includes(
                                                    role.id,
                                                )}
                                                onChange={(e) =>
                                                    form.setData(
                                                        'role_ids',
                                                        e.target.checked
                                                            ? [
                                                                  ...form.data
                                                                      .role_ids,
                                                                  role.id,
                                                              ]
                                                            : form.data.role_ids.filter(
                                                                  (id) =>
                                                                      id !==
                                                                      role.id,
                                                              ),
                                                    )
                                                }
                                            />
                                            {role.label}
                                        </label>
                                    ))}
                                    <InputError
                                        message={form.errors.role_ids}
                                    />
                                </fieldset>
                                <fieldset className="grid gap-2">
                                    <legend className="text-sm font-medium">
                                        Laboratorium
                                    </legend>
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
                                                                  ...form.data
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
                                    <InputError
                                        message={form.errors.laboratory_ids}
                                    />
                                </fieldset>
                                <div className="grid gap-2">
                                    <Label>Laboratorium default</Label>
                                    <Select
                                        value={
                                            form.data.default_laboratory_id
                                                ? String(
                                                      form.data
                                                          .default_laboratory_id,
                                                  )
                                                : 'none'
                                        }
                                        onValueChange={(v) =>
                                            form.setData(
                                                'default_laboratory_id',
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
                                            {laboratories
                                                .filter((lab) =>
                                                    form.data.laboratory_ids.includes(
                                                        lab.id,
                                                    ),
                                                )
                                                .map((lab) => (
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
                                    User aktif
                                </label>
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
                                    Simpan Akses
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
                <Dialog open={creating} onOpenChange={setCreating}>
                    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                        <form onSubmit={submitCreate}>
                            <DialogHeader>
                                <DialogTitle>Tambah User</DialogTitle>
                            </DialogHeader>
                            <div className="my-5 grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="new-name">Nama</Label>
                                    <Input
                                        id="new-name"
                                        value={createForm.data.name}
                                        onChange={(event) =>
                                            createForm.setData(
                                                'name',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={createForm.errors.name}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="new-email">Email</Label>
                                    <Input
                                        id="new-email"
                                        type="email"
                                        value={createForm.data.email}
                                        onChange={(event) =>
                                            createForm.setData(
                                                'email',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={createForm.errors.email}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="new-password">
                                        Password awal
                                    </Label>
                                    <Input
                                        id="new-password"
                                        type="password"
                                        value={createForm.data.password}
                                        onChange={(event) =>
                                            createForm.setData(
                                                'password',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={createForm.errors.password}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="new-password-confirmation">
                                        Konfirmasi password
                                    </Label>
                                    <Input
                                        id="new-password-confirmation"
                                        type="password"
                                        value={
                                            createForm.data
                                                .password_confirmation
                                        }
                                        onChange={(event) =>
                                            createForm.setData(
                                                'password_confirmation',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <fieldset className="grid gap-2">
                                    <legend className="text-sm font-medium">
                                        Role
                                    </legend>
                                    {roles.map((role) => (
                                        <label
                                            key={role.id}
                                            className="flex min-h-11 items-center gap-3 rounded-lg border px-3"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={createForm.data.role_ids.includes(
                                                    role.id,
                                                )}
                                                onChange={(event) =>
                                                    createForm.setData(
                                                        'role_ids',
                                                        event.target.checked
                                                            ? [
                                                                  ...createForm
                                                                      .data
                                                                      .role_ids,
                                                                  role.id,
                                                              ]
                                                            : createForm.data.role_ids.filter(
                                                                  (id) =>
                                                                      id !==
                                                                      role.id,
                                                              ),
                                                    )
                                                }
                                            />
                                            {role.label}
                                        </label>
                                    ))}
                                    <InputError
                                        message={createForm.errors.role_ids}
                                    />
                                </fieldset>
                                <fieldset className="grid gap-2">
                                    <legend className="text-sm font-medium">
                                        Laboratorium
                                    </legend>
                                    {laboratories.map((lab) => (
                                        <label
                                            key={lab.id}
                                            className="flex min-h-11 items-center gap-3 rounded-lg border px-3"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={createForm.data.laboratory_ids.includes(
                                                    lab.id,
                                                )}
                                                onChange={(event) =>
                                                    createForm.setData(
                                                        'laboratory_ids',
                                                        event.target.checked
                                                            ? [
                                                                  ...createForm
                                                                      .data
                                                                      .laboratory_ids,
                                                                  lab.id,
                                                              ]
                                                            : createForm.data.laboratory_ids.filter(
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
                                    <InputError
                                        message={
                                            createForm.errors.laboratory_ids
                                        }
                                    />
                                </fieldset>
                                <div className="grid gap-2 sm:col-span-2">
                                    <Label>Laboratorium default</Label>
                                    <Select
                                        value={
                                            createForm.data
                                                .default_laboratory_id
                                                ? String(
                                                      createForm.data
                                                          .default_laboratory_id,
                                                  )
                                                : 'none'
                                        }
                                        onValueChange={(value) =>
                                            createForm.setData(
                                                'default_laboratory_id',
                                                value === 'none'
                                                    ? null
                                                    : Number(value),
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
                                            {laboratories
                                                .filter((lab) =>
                                                    createForm.data.laboratory_ids.includes(
                                                        lab.id,
                                                    ),
                                                )
                                                .map((lab) => (
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
                                        message={
                                            createForm.errors
                                                .default_laboratory_id
                                        }
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setCreating(false)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={createForm.processing}
                                >
                                    Buat User
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
Users.layout = {
    breadcrumbs: [
        { title: 'Administrasi', href: '/administration/users' },
        { title: 'User & Akses', href: '/administration/users' },
    ],
};
