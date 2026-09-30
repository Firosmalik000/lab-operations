import type { ReactNode } from 'react';
import { EmptyState } from '@/components/empty-state';
import { Pagination } from '@/components/pagination';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

export interface Column<T> {
    header: ReactNode;
    accessorKey?: keyof T | string;
    className?: string;
    headerClassName?: string;
    cell: (row: T, index: number) => ReactNode;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    keyExtractor: (item: T) => string | number;
    paginationLinks?: { url: string | null; label: string; active: boolean }[];
    toolbar?: ReactNode;
    emptyTitle?: string;
    emptyDescription?: string;
    isLoading?: boolean;
}

export function DataTable<T>({
    data,
    columns,
    keyExtractor,
    paginationLinks,
    toolbar,
    emptyTitle = 'Data tidak ditemukan',
    emptyDescription,
}: DataTableProps<T>) {
    return (
        <div className="flex flex-col gap-4">
            {toolbar && <div className="w-full">{toolbar}</div>}

            <div className="overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs">
                {data.length === 0 ? (
                    <div className="py-12">
                        <EmptyState title={emptyTitle} description={emptyDescription} />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {columns.map((column, idx) => (
                                    <TableHead
                                        key={idx}
                                        className={column.headerClassName ?? column.className}
                                    >
                                        {column.header}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((row, index) => (
                                <TableRow key={keyExtractor(row)}>
                                    {columns.map((column, colIdx) => (
                                        <TableCell
                                            key={colIdx}
                                            className={column.className}
                                        >
                                            {column.cell(row, index)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            {paginationLinks && paginationLinks.length > 3 && (
                <div className="flex items-center justify-end">
                    <Pagination links={paginationLinks} />
                </div>
            )}
        </div>
    );
}
