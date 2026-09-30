import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
    className?: string;
    showLabel?: boolean;
}

export function ThemeToggle({
    className,
    showLabel = false,
}: ThemeToggleProps) {
    const { resolvedAppearance, updateAppearance } = useAppearance();

    const isDark = resolvedAppearance === 'dark';

    const toggleTheme = () => {
        updateAppearance(isDark ? 'light' : 'dark');
    };

    const label = isDark
        ? 'Mode Gelap (Klik untuk ganti ke Terang)'
        : 'Mode Terang (Klik untuk ganti ke Gelap)';

    return (
        <TooltipProvider delayDuration={300}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        size={showLabel ? 'default' : 'icon'}
                        className={cn(
                            'relative h-9 rounded-lg border border-sidebar-border/70 bg-sidebar/40 text-muted-foreground shadow-xs transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                            showLabel ? 'gap-2 px-3' : 'w-9',
                            className,
                        )}
                        onClick={toggleTheme}
                        aria-label={label}
                        data-test="theme-toggle"
                    >
                        <Sun className="h-4 w-4 scale-100 rotate-0 text-amber-500 transition-all duration-200 dark:scale-0 dark:-rotate-90" />
                        <Moon className="absolute h-4 w-4 scale-0 rotate-90 text-sky-400 transition-all duration-200 dark:scale-100 dark:rotate-0" />
                        {showLabel && (
                            <span className="text-xs font-medium">
                                {isDark ? 'Gelap' : 'Terang'}
                            </span>
                        )}
                        <span className="sr-only">{label}</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="end">
                    <p>
                        {isDark
                            ? 'Ganti ke mode terang'
                            : 'Ganti ke mode gelap'}
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

export default ThemeToggle;
