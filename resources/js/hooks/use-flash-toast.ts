import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';

export function useFlashToast(): void {
    useEffect(() => {
        const show = (flash?: {
            success?: string | null;
            error?: string | null;
        }) => {
            if (flash?.success) toast.success(flash.success);
            if (flash?.error) toast.error(flash.error);
        };
        const pageData = document.querySelector<HTMLScriptElement>(
            'script[data-page="app"]',
        )?.textContent;
        if (pageData) {
            const page = JSON.parse(pageData) as {
                props?: {
                    flash?: { success?: string | null; error?: string | null };
                };
            };
            show(page.props?.flash);
        }

        return router.on('navigate', (event) => {
            const page = (
                event as CustomEvent<{
                    page?: {
                        props?: {
                            flash?: {
                                success?: string | null;
                                error?: string | null;
                            };
                        };
                    };
                }>
            ).detail?.page;
            show(page?.props?.flash);
        });
    }, []);
}
