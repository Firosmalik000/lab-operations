import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

type LinkItem = { url: string | null; label: string; active: boolean };

export function Pagination({ links }: { links: LinkItem[] }) {
    if (links.length <= 3) return null;
    return (
        <nav
            aria-label="Paginasi"
            className="flex flex-wrap justify-center gap-1 pt-4"
        >
            {links.map((link, index) => (
                <Button
                    key={`${link.label}-${index}`}
                    asChild={Boolean(link.url)}
                    variant={link.active ? 'default' : 'outline'}
                    size="sm"
                    disabled={!link.url}
                >
                    {link.url ? (
                        <Link
                            href={link.url}
                            preserveScroll
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ) : (
                        <span
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    )}
                </Button>
            ))}
        </nav>
    );
}
