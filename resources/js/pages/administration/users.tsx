import { Head, router, useForm } from '@inertiajs/react';
import {
    Check,
    Copy,
    Mail,
    Pencil,
    Plus,
    RotateCcw,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import InputError from '@/components/input-error';
import { PageHeading } from '@/components/page-heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
type Invitation = {
    id: number;
    email: string;
    name: string;
    role: string;
    laboratory_ids: number[];
    default_laboratory: Option | null;
    inviter: Option | null;
    is_pending: boolean;
    is_expired: boolean;
    is_accepted: boolean;
    accept_url: string;
    expires_at: string;
    created_at: string;
};
type Page<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
};

export default function Users({
    users,
    roles,
    laboratories,
    invitations = [],
    can = { manage: true },
    currentUserId,
}: {
    users: Page<User>;
    roles: Option[];
    laboratories: Option[];
    invitations?: Invitation[];
    can?: { manage: boolean };
    currentUserId?: number;
}) {
    const [selected, setSelected] = useState<User | null>(null);
    const [inviting, setInviting] = useState(false);
    const [creating, setCreating] = useState(false);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);
    const [cancelingInvitation, setCancelingInvitation] =
        useState<Invitation | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCanceling, setIsCanceling] = useState(false);
    const [resendingId, setResendingId] = useState<number | null>(null);
    const [copiedId, setCopiedId] = useState<number | null>(null);

    const inviteForm = useForm({
        name: '',
        email: '',
        laboratory_ids: [] as number[],
        default_laboratory_id: null as number | null,
    });

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
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role_ids: [] as number[],
        laboratory_ids: [] as number[],
        default_laboratory_id: null as number | null,
        is_active: true,
    });

    const show = (user: User) => {
        setSelected(user);
        form.setData({
            name: user.name,
            email: user.email,
            password: '',
            password_confirmation: '',
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

    const submitInvite = (event: React.FormEvent) => {
        event.preventDefault();
        inviteForm.post('/administration/users/invite', {
            preserveScroll: true,
            onSuccess: () => {
                setInviting(false);
                inviteForm.reset();
            },
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

    const confirmDelete = () => {
        if (!deletingUser) return;
        setIsDeleting(true);
        router.delete(`/administration/users/${deletingUser.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeletingUser(null),
            onFinish: () => setIsDeleting(false),
        });
    };

    const confirmCancelInvitation = () => {
        if (!cancelingInvitation) return;
        setIsCanceling(true);
        router.delete(`/administration/invitations/${cancelingInvitation.id}`, {
            preserveScroll: true,
            onSuccess: () => setCancelingInvitation(null),
            onFinish: () => setIsCanceling(false),
        });
    };

    const handleCopyLink = (invitation: Invitation) => {
        void navigator.clipboard.writeText(invitation.accept_url);
        setCopiedId(invitation.id);
        toast.success('Tautan aktivasi berhasil disalin ke clipboard');
        setTimeout(() => setCopiedId(null), 2500);
    };

    const handleResend = (invitation: Invitation) => {
        setResendingId(invitation.id);
        router.post(
            `/administration/invitations/${invitation.id}/resend`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setResendingId(null),
            },
        );
    };

    const pendingInvitations = invitations.filter((inv) => !inv.is_accepted);

    const columns: Column<User>[] = [
        {
            header: 'Pengguna',
            cell: (user) => (
                <div className="min-w-[160px]">
                    <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">
                            {user.name}
                        </p>
                        {user.id === currentUserId && (
                            <Badge
                                variant="outline"
                                className="px-1.5 py-0 text-[10px]"
                            >
                                Anda
                            </Badge>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {user.email}
                    </p>
                </div>
            ),
        },
        {
            header: 'Role',
            className: 'hidden sm:table-cell',
            cell: (user) => (
                <div className="flex flex-wrap gap-1">
                    {user.roles.map((role) => (
                        <Badge
                            key={role.id}
                            variant="secondary"
                            className="text-xs"
                        >
                            {role.label ?? role.name}
                        </Badge>
                    ))}
                </div>
            ),
        },
        {
            header: 'Laboratorium',
            className: 'hidden md:table-cell max-w-[200px]',
            cell: (user) => (
                <p
                    className="truncate text-xs text-muted-foreground"
                    title={user.laboratories.map((l) => l.name).join(', ')}
                >
                    {user.laboratories.length > 0
                        ? user.laboratories.map((l) => l.name).join(', ')
                        : '—'}
                </p>
            ),
        },
        {
            header: 'Status',
            cell: (user) => (
                <Badge
                    variant={user.is_active ? 'secondary' : 'destructive'}
                    className="text-xs"
                >
                    {user.is_active ? 'Aktif' : 'Nonaktif'}
                </Badge>
            ),
        },
        {
            header: <span className="sr-only">Aksi</span>,
            className: 'text-right whitespace-nowrap',
            cell: (user) => (
                <div className="flex items-center justify-end gap-1">
                    {can.manage && (
                        <>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="size-8 text-muted-foreground hover:text-foreground"
                                aria-label={`Edit ${user.name}`}
                                onClick={() => show(user)}
                                title="Edit Akses User"
                            >
                                <Pencil className="size-3.5" />
                            </Button>
                            {user.id !== currentUserId && (
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="size-8 text-muted-foreground hover:text-destructive"
                                    aria-label={`Hapus ${user.name}`}
                                    onClick={() => setDeletingUser(user)}
                                    title="Hapus User"
                                >
                                    <Trash2 className="size-3.5" />
                                </Button>
                            )}
                        </>
                    )}
                </div>
            ),
        },
    ];

    const invitationColumns: Column<Invitation>[] = [
        {
            header: 'Calon Staf',
            cell: (inv) => (
                <div className="min-w-[160px]">
                    <p className="font-semibold text-foreground">{inv.name}</p>
                    <p className="text-xs text-muted-foreground">{inv.email}</p>
                </div>
            ),
        },
        {
            header: 'Role',
            className: 'hidden sm:table-cell',
            cell: (inv) => (
                <Badge variant="outline" className="text-xs uppercase">
                    {inv.role || 'Staff'}
                </Badge>
            ),
        },
        {
            header: 'Laboratorium',
            className: 'hidden md:table-cell max-w-[200px]',
            cell: (inv) => {
                const labNames = laboratories
                    .filter((l) => inv.laboratory_ids.includes(l.id))
                    .map((l) => l.name)
                    .join(', ');
                return (
                    <p
                        className="truncate text-xs text-muted-foreground"
                        title={labNames}
                    >
                        {labNames || '—'}
                    </p>
                );
            },
        },
        {
            header: 'Status Undangan',
            cell: (inv) => (
                <Badge
                    variant={inv.is_expired ? 'destructive' : 'secondary'}
                    className="text-xs"
                >
                    {inv.is_expired ? 'Kedaluwarsa' : 'Menunggu Aktivasi'}
                </Badge>
            ),
        },
        {
            header: <span className="sr-only">Aksi</span>,
            className: 'text-right whitespace-nowrap',
            cell: (inv) => (
                <div className="flex items-center justify-end gap-1">
                    {can.manage && (
                        <>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="size-8 text-muted-foreground hover:text-foreground"
                                onClick={() => handleCopyLink(inv)}
                                title="Salin Tautan Aktivasi"
                            >
                                {copiedId === inv.id ? (
                                    <Check className="size-3.5 text-green-600" />
                                ) : (
                                    <Copy className="size-3.5" />
                                )}
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="size-8 text-muted-foreground hover:text-foreground"
                                disabled={resendingId === inv.id}
                                onClick={() => handleResend(inv)}
                                title="Kirim Ulang Email"
                            >
                                <RotateCcw
                                    className={`size-3.5 ${resendingId === inv.id ? 'animate-spin' : ''}`}
                                />
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="size-8 text-muted-foreground hover:text-destructive"
                                onClick={() => setCancelingInvitation(inv)}
                                title="Batalkan Undangan"
                            >
                                <Trash2 className="size-3.5" />
                            </Button>
                        </>
                    )}
                </div>
            ),
        },
    ];

    return (
        <>
            <Head title="User & Akses" />
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
                <PageHeading
                    title="User & Akses"
                    actions={
                        can.manage && (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setCreating(true)}
                                    size="sm"
                                    className="gap-1.5"
                                >
                                    <Plus className="size-4" /> Buat Langsung
                                </Button>
                                <Button
                                    onClick={() => setInviting(true)}
                                    size="sm"
                                    className="gap-1.5"
                                >
                                    <Mail className="size-4" /> Undang Staf
                                </Button>
                            </div>
                        )
                    }
                />

                {pendingInvitations.length > 0 && (
                    <Card className="border-primary/20 bg-primary/[0.02]">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base font-semibold">
                                        Undangan Staf Tertunda (
                                        {pendingInvitations.length})
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Staf yang telah diundang namun belum
                                        menyelesaikan aktivasi kata sandi.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <DataTable
                                data={pendingInvitations}
                                columns={invitationColumns}
                                keyExtractor={(inv) => inv.id}
                                emptyTitle="Tidak ada undangan tertunda"
                                emptyDescription=""
                            />
                        </CardContent>
                    </Card>
                )}

                <div>
                    <h3 className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                        Daftar Pengguna Aktif
                    </h3>
                    <DataTable
                        data={users.data}
                        columns={columns}
                        keyExtractor={(user) => user.id}
                        paginationLinks={users.links}
                        emptyTitle="Belum ada user"
                        emptyDescription="Tambahkan user pertama untuk mengelola akses operasional laboratorium."
                    />
                </div>

                {/* Invite Staff Modal */}
                <Dialog open={inviting} onOpenChange={setInviting}>
                    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
                        <form onSubmit={submitInvite}>
                            <DialogHeader>
                                <DialogTitle>
                                    Undang Staf Baru via Email
                                </DialogTitle>
                            </DialogHeader>
                            <div className="my-4 grid gap-4">
                                <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
                                    Undangan akan dikirimkan ke alamat email
                                    tujuan. Calon staf akan menerima tautan
                                    untuk menentukan kata sandi akun mereka
                                    sendiri dengan role otomatis{' '}
                                    <span className="font-semibold text-foreground">
                                        Staff
                                    </span>
                                    .
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="invite-name">
                                        Nama Lengkap
                                    </Label>
                                    <Input
                                        id="invite-name"
                                        value={inviteForm.data.name}
                                        onChange={(e) =>
                                            inviteForm.setData(
                                                'name',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="cth. Siti Rahmawati"
                                        required
                                    />
                                    <InputError
                                        message={inviteForm.errors.name}
                                    />
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="invite-email">
                                        Alamat Email
                                    </Label>
                                    <Input
                                        id="invite-email"
                                        type="email"
                                        value={inviteForm.data.email}
                                        onChange={(e) =>
                                            inviteForm.setData(
                                                'email',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="staf@laboratorium.id"
                                        required
                                    />
                                    <InputError
                                        message={inviteForm.errors.email}
                                    />
                                </div>

                                <fieldset className="grid gap-2">
                                    <legend className="text-sm font-medium">
                                        Akses Laboratorium
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
                                                    checked={inviteForm.data.laboratory_ids.includes(
                                                        lab.id,
                                                    )}
                                                    onChange={(e) => {
                                                        const next = e.target
                                                            .checked
                                                            ? [
                                                                  ...inviteForm
                                                                      .data
                                                                      .laboratory_ids,
                                                                  lab.id,
                                                              ]
                                                            : inviteForm.data.laboratory_ids.filter(
                                                                  (id) =>
                                                                      id !==
                                                                      lab.id,
                                                              );
                                                        inviteForm.setData(
                                                            'laboratory_ids',
                                                            next,
                                                        );
                                                        if (
                                                            !next.includes(
                                                                inviteForm.data
                                                                    .default_laboratory_id ??
                                                                    -1,
                                                            )
                                                        ) {
                                                            inviteForm.setData(
                                                                'default_laboratory_id',
                                                                null,
                                                            );
                                                        }
                                                    }}
                                                />
                                                {lab.name}
                                            </label>
                                        ))}
                                    </div>
                                    <InputError
                                        message={
                                            inviteForm.errors.laboratory_ids
                                        }
                                    />
                                </fieldset>

                                <div className="grid gap-1.5">
                                    <Label>Laboratorium Default</Label>
                                    <Select
                                        value={
                                            inviteForm.data
                                                .default_laboratory_id
                                                ? String(
                                                      inviteForm.data
                                                          .default_laboratory_id,
                                                  )
                                                : 'none'
                                        }
                                        onValueChange={(val) =>
                                            inviteForm.setData(
                                                'default_laboratory_id',
                                                val === 'none'
                                                    ? null
                                                    : Number(val),
                                            )
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih laboratorium default" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">
                                                Belum dipilih
                                            </SelectItem>
                                            {laboratories
                                                .filter((l) =>
                                                    inviteForm.data.laboratory_ids.includes(
                                                        l.id,
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
                                            inviteForm.errors
                                                .default_laboratory_id
                                        }
                                    />
                                </div>
                            </div>
                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setInviting(false)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={inviteForm.processing}
                                >
                                    Kirim Undangan Email
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Edit User Modal */}
                <Dialog
                    open={Boolean(selected)}
                    onOpenChange={(open) => !open && setSelected(null)}
                >
                    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
                        <form onSubmit={submit}>
                            <DialogHeader>
                                <DialogTitle>
                                    Edit Pengguna: {selected?.name}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="my-4 grid gap-4">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="edit-name">
                                        Nama Lengkap
                                    </Label>
                                    <Input
                                        id="edit-name"
                                        value={form.data.name}
                                        onChange={(e) =>
                                            form.setData('name', e.target.value)
                                        }
                                        placeholder="Nama Pengguna"
                                        required
                                    />
                                    <InputError message={form.errors.name} />
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="edit-email">
                                        Alamat Email
                                    </Label>
                                    <Input
                                        id="edit-email"
                                        type="email"
                                        value={form.data.email}
                                        onChange={(e) =>
                                            form.setData('email', e.target.value)
                                        }
                                        placeholder="email@laboratorium.id"
                                        required
                                    />
                                    <InputError message={form.errors.email} />
                                </div>

                                <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
                                    Kosongkan kata sandi jika tidak ingin mengubah kata sandi pengguna ini.
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="edit-password">
                                            Kata Sandi Baru (Opsional)
                                        </Label>
                                        <Input
                                            id="edit-password"
                                            type="password"
                                            value={form.data.password}
                                            onChange={(e) =>
                                                form.setData(
                                                    'password',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Minimal 8 karakter"
                                        />
                                        <InputError
                                            message={form.errors.password}
                                        />
                                    </div>

                                    <div className="grid gap-1.5">
                                        <Label htmlFor="edit-password-confirmation">
                                            Konfirmasi Kata Sandi
                                        </Label>
                                        <Input
                                            id="edit-password-confirmation"
                                            type="password"
                                            value={
                                                form.data.password_confirmation
                                            }
                                            onChange={(e) =>
                                                form.setData(
                                                    'password_confirmation',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Ulangi kata sandi baru"
                                        />
                                        <InputError
                                            message={
                                                form.errors
                                                    .password_confirmation
                                            }
                                        />
                                    </div>
                                </div>

                                <fieldset className="grid gap-2">
                                    <legend className="text-sm font-medium">
                                        Role Akses
                                    </legend>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {roles.map((role) => (
                                            <label
                                                key={role.id}
                                                className="flex min-h-10 items-center gap-2.5 rounded-lg border px-3 text-sm transition-colors hover:bg-muted/30"
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-input text-primary focus:ring-primary"
                                                    checked={form.data.role_ids.includes(
                                                        role.id,
                                                    )}
                                                    onChange={(e) =>
                                                        form.setData(
                                                            'role_ids',
                                                            e.target.checked
                                                                ? [
                                                                      ...form
                                                                          .data
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
                                                {role.label ?? role.name}
                                            </label>
                                        ))}
                                    </div>
                                    <InputError
                                        message={form.errors.role_ids}
                                    />
                                </fieldset>

                                <fieldset className="grid gap-2">
                                    <legend className="text-sm font-medium">
                                        Akses Laboratorium
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
                                                    onChange={(e) => {
                                                        const next = e.target
                                                            .checked
                                                            ? [
                                                                  ...form.data
                                                                      .laboratory_ids,
                                                                  lab.id,
                                                              ]
                                                            : form.data.laboratory_ids.filter(
                                                                  (id) =>
                                                                      id !==
                                                                      lab.id,
                                                              );
                                                        form.setData(
                                                            'laboratory_ids',
                                                            next,
                                                        );
                                                        if (
                                                            !next.includes(
                                                                form.data
                                                                    .default_laboratory_id ??
                                                                    -1,
                                                            )
                                                        ) {
                                                            form.setData(
                                                                'default_laboratory_id',
                                                                null,
                                                            );
                                                        }
                                                    }}
                                                />
                                                {lab.name}
                                            </label>
                                        ))}
                                    </div>
                                    <InputError
                                        message={form.errors.laboratory_ids}
                                    />
                                </fieldset>

                                <div className="grid gap-1.5">
                                    <Label>Laboratorium Default</Label>
                                    <Select
                                        value={
                                            form.data.default_laboratory_id
                                                ? String(
                                                      form.data
                                                          .default_laboratory_id,
                                                  )
                                                : 'none'
                                        }
                                        onValueChange={(val) =>
                                            form.setData(
                                                'default_laboratory_id',
                                                val === 'none'
                                                    ? null
                                                    : Number(val),
                                            )
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih laboratorium default" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">
                                                Belum dipilih
                                            </SelectItem>
                                            {laboratories
                                                .filter((l) =>
                                                    form.data.laboratory_ids.includes(
                                                        l.id,
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
                                            form.errors.default_laboratory_id
                                        }
                                    />
                                </div>

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
                                    Akun Aktif
                                </label>
                                <InputError message={form.errors.is_active} />
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

                {/* Create Direct User Modal */}
                <Dialog open={creating} onOpenChange={setCreating}>
                    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
                        <form onSubmit={submitCreate}>
                            <DialogHeader>
                                <DialogTitle>
                                    Tambah Pengguna Langsung
                                </DialogTitle>
                            </DialogHeader>
                            <div className="my-4 grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-1.5 sm:col-span-2">
                                    <Label htmlFor="create-name">
                                        Nama Lengkap
                                    </Label>
                                    <Input
                                        id="create-name"
                                        value={createForm.data.name}
                                        onChange={(e) =>
                                            createForm.setData(
                                                'name',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="cth. Budi Santoso"
                                    />
                                    <InputError
                                        message={createForm.errors.name}
                                    />
                                </div>
                                <div className="grid gap-1.5 sm:col-span-2">
                                    <Label htmlFor="create-email">
                                        Alamat Email
                                    </Label>
                                    <Input
                                        id="create-email"
                                        type="email"
                                        value={createForm.data.email}
                                        onChange={(e) =>
                                            createForm.setData(
                                                'email',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="nama@laboratorium.id"
                                    />
                                    <InputError
                                        message={createForm.errors.email}
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="create-password">
                                        Password
                                    </Label>
                                    <Input
                                        id="create-password"
                                        type="password"
                                        value={createForm.data.password}
                                        onChange={(e) =>
                                            createForm.setData(
                                                'password',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={createForm.errors.password}
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="create-password-confirmation">
                                        Konfirmasi Password
                                    </Label>
                                    <Input
                                        id="create-password-confirmation"
                                        type="password"
                                        value={
                                            createForm.data
                                                .password_confirmation
                                        }
                                        onChange={(e) =>
                                            createForm.setData(
                                                'password_confirmation',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={
                                            createForm.errors
                                                .password_confirmation
                                        }
                                    />
                                </div>

                                <fieldset className="grid gap-2 sm:col-span-2">
                                    <legend className="text-sm font-medium">
                                        Role Akses
                                    </legend>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {roles.map((role) => (
                                            <label
                                                key={role.id}
                                                className="flex min-h-10 items-center gap-2.5 rounded-lg border px-3 text-sm transition-colors hover:bg-muted/30"
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-input text-primary focus:ring-primary"
                                                    checked={createForm.data.role_ids.includes(
                                                        role.id,
                                                    )}
                                                    onChange={(e) =>
                                                        createForm.setData(
                                                            'role_ids',
                                                            e.target.checked
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
                                                {role.label ?? role.name}
                                            </label>
                                        ))}
                                    </div>
                                    <InputError
                                        message={createForm.errors.role_ids}
                                    />
                                </fieldset>

                                <fieldset className="grid gap-2 sm:col-span-2">
                                    <legend className="text-sm font-medium">
                                        Akses Laboratorium
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
                                                    checked={createForm.data.laboratory_ids.includes(
                                                        lab.id,
                                                    )}
                                                    onChange={(e) => {
                                                        const next = e.target
                                                            .checked
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
                                                              );
                                                        createForm.setData(
                                                            'laboratory_ids',
                                                            next,
                                                        );
                                                        if (
                                                            !next.includes(
                                                                createForm.data
                                                                    .default_laboratory_id ??
                                                                    -1,
                                                            )
                                                        ) {
                                                            createForm.setData(
                                                                'default_laboratory_id',
                                                                null,
                                                            );
                                                        }
                                                    }}
                                                />
                                                {lab.name}
                                            </label>
                                        ))}
                                    </div>
                                    <InputError
                                        message={
                                            createForm.errors.laboratory_ids
                                        }
                                    />
                                </fieldset>

                                <div className="grid gap-1.5 sm:col-span-2">
                                    <Label>Laboratorium Default</Label>
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
                                        onValueChange={(val) =>
                                            createForm.setData(
                                                'default_laboratory_id',
                                                val === 'none'
                                                    ? null
                                                    : Number(val),
                                            )
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih laboratorium default" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">
                                                Belum dipilih
                                            </SelectItem>
                                            {laboratories
                                                .filter((l) =>
                                                    createForm.data.laboratory_ids.includes(
                                                        l.id,
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
                            <DialogFooter className="gap-2 sm:gap-0">
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
                                    Simpan User
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <ConfirmDeleteDialog
                    open={Boolean(deletingUser)}
                    onOpenChange={(v) => !v && setDeletingUser(null)}
                    itemName={deletingUser?.name}
                    loading={isDeleting}
                    onConfirm={confirmDelete}
                />

                <ConfirmDeleteDialog
                    open={Boolean(cancelingInvitation)}
                    onOpenChange={(v) => !v && setCancelingInvitation(null)}
                    title="Batalkan Undangan"
                    description={`Apakah Anda yakin ingin membatalkan undangan untuk ${cancelingInvitation?.email}? Tautan aktivasi tidak akan dapat digunakan lagi.`}
                    itemName={cancelingInvitation?.name}
                    loading={isCanceling}
                    onConfirm={confirmCancelInvitation}
                />
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
