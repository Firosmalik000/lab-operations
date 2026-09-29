import { Inbox } from 'lucide-react';

export function EmptyState({
    title = 'Belum ada data',
    description = 'Data akan muncul di sini setelah tersedia.',
}: {
    title?: string;
    description?: string;
}) {
    return (
        <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 text-center">
            <Inbox
                className="mb-3 size-8 text-muted-foreground"
                aria-hidden="true"
            />
            <h2 className="font-medium">{title}</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
                {description}
            </p>
        </div>
    );
}
