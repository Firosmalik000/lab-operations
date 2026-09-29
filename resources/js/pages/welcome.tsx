import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, Boxes, ClipboardCheck, FlaskConical } from 'lucide-react';
import { dashboard, login } from '@/routes';
import { Button } from '@/components/ui/button';

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Portal Operasional Laboratorium" />
            <main className="min-h-screen bg-background text-foreground">
                <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-6 sm:px-8">
                    <header className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                                <FlaskConical
                                    className="size-5"
                                    aria-hidden="true"
                                />
                            </span>
                            <div>
                                <p className="font-semibold">
                                    Laboratory Operations
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Portal operasional terintegrasi
                                </p>
                            </div>
                        </div>
                        <Button asChild>
                            <Link href={auth.user ? dashboard() : login()}>
                                {auth.user ? 'Buka Dashboard' : 'Masuk'}
                                <ArrowRight aria-hidden="true" />
                            </Link>
                        </Button>
                    </header>
                    <section className="grid flex-1 items-center gap-10 py-16 lg:grid-cols-[1.2fr_0.8fr]">
                        <div>
                            <p className="mb-4 text-sm font-medium text-primary">
                                Operasional laboratorium yang dapat ditelusuri
                            </p>
                            <h1 className="max-w-3xl text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
                                Pencatatan bahan dan inventory yang tenang,
                                cepat, dan terpercaya.
                            </h1>
                            <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                                Kelola penggunaan bahan, pergerakan stok,
                                laporan, dan audit dalam satu ruang kerja dengan
                                akses sesuai laboratorium.
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <Button asChild size="lg">
                                    <Link
                                        href={auth.user ? dashboard() : login()}
                                    >
                                        {auth.user
                                            ? 'Lanjut ke Dashboard'
                                            : 'Masuk ke Portal'}
                                        <ArrowRight aria-hidden="true" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                        <div className="grid gap-4">
                            <Feature
                                icon={ClipboardCheck}
                                title="Penggunaan bahan"
                                description="Catat banyak item dalam satu transaksi dengan alur draft, submit, dan void."
                            />
                            <Feature
                                icon={Boxes}
                                title="Inventory opsional"
                                description="Saldo berasal dari ledger movement yang transparan dan dapat diaudit."
                            />
                            <Feature
                                icon={FlaskConical}
                                title="Multi-laboratorium"
                                description="Data operasional dibatasi sesuai role dan laboratorium pengguna."
                            />
                        </div>
                    </section>
                    <footer className="border-t py-5 text-sm text-muted-foreground">
                        Laboratory Operations Portal
                    </footer>
                </div>
            </main>
        </>
    );
}

function Feature({
    icon: Icon,
    title,
    description,
}: {
    icon: typeof FlaskConical;
    title: string;
    description: string;
}) {
    return (
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                    <h2 className="font-semibold">{title}</h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {description}
                    </p>
                </div>
            </div>
        </div>
    );
}
