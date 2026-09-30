import { Head, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

type Props = {
    invitation: {
        token: string;
        name: string;
        email: string;
        role: string;
    };
};

export default function AcceptInvitation({ invitation }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        password: '',
        password_confirmation: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/invitations/${invitation.token}`);
    };

    return (
        <>
            <Head title="Aktivasi Akun Staf" />

            <form onSubmit={submit} className="flex flex-col gap-6">
                <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 text-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                            Peran Akses
                        </span>
                        <Badge variant="secondary" className="capitalize">
                            {invitation.role || 'Staff'}
                        </Badge>
                    </div>
                    <div>
                        <span className="text-xs text-muted-foreground">
                            Nama
                        </span>
                        <p className="font-medium text-foreground">
                            {invitation.name}
                        </p>
                    </div>
                    <div>
                        <span className="text-xs text-muted-foreground">
                            Email
                        </span>
                        <p className="font-medium text-foreground">
                            {invitation.email}
                        </p>
                    </div>
                </div>

                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="password">Kata Sandi Baru</Label>
                        <PasswordInput
                            id="password"
                            name="password"
                            value={data.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                            autoComplete="new-password"
                            autoFocus
                            placeholder="Minimal 8 karakter"
                            required
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation">
                            Konfirmasi Kata Sandi
                        </Label>
                        <PasswordInput
                            id="password_confirmation"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            onChange={(e) =>
                                setData('password_confirmation', e.target.value)
                            }
                            autoComplete="new-password"
                            placeholder="Ulangi kata sandi"
                            required
                        />
                        <InputError message={errors.password_confirmation} />
                    </div>

                    <Button
                        type="submit"
                        className="mt-2 w-full"
                        disabled={processing}
                    >
                        {processing && <Spinner />}
                        Aktivasi Akun & Masuk
                    </Button>
                </div>
            </form>
        </>
    );
}

AcceptInvitation.layout = {
    title: 'Aktivasi Akun Staf',
    description:
        'Atur kata sandi Anda untuk mulai mengakses operasional laboratorium.',
};
