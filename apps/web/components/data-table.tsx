'use client'

import { Card, CardContent, Pagination, Skeleton, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, EmptyState } from '@kinetix/ui'
import { cn } from '@kinetix/utils'

export interface DataTableColumn<T> {
  key: string
  header: string
  render: (row: T) => React.ReactNode
  className?: string
  hideOnMobile?: boolean
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  rows: T[]
  loading?: boolean
  page?: number
  pageSize?: number
  total?: number
  onPageChange?: (page: number) => void
  onRowClick?: (row: T) => void
  emptyTitle?: string
  emptyDescription?: string
  keyField: (row: T) => string
}

export function DataTable<T>({
  columns,
  rows,
  loading,
  page = 1,
  pageSize = 10,
  total,
  onPageChange,
  onRowClick,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  keyField,
}: DataTableProps<T>) {
  const totalPages = total !== undefined ? Math.max(1, Math.ceil(total / pageSize)) : 1

  return (
    <Card className="border-white/60 bg-white/60 shadow-[0_8px_32px_rgba(18,57,60,0.18),0_1px_0_rgba(255,255,255,0.6)_inset] backdrop-blur-xl supports-[backdrop-filter]:bg-white/40">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/5 hover:bg-primary/5">
                {columns.map((column) => (
                  <TableHead key={column.key} className={cn(column.className, column.hideOnMobile && 'hidden sm:table-cell', 'text-primary')}>
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {columns.map((column) => (
                      <TableCell key={column.key} className={cn(column.hideOnMobile && 'hidden sm:table-cell')}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="p-6">
                    <EmptyState title={emptyTitle} description={emptyDescription} />
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow
                    key={keyField(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(onRowClick && 'cursor-pointer hover:bg-primary/5')}
                  >
                    {columns.map((column) => (
                      <TableCell key={column.key} className={cn(column.className, column.hideOnMobile && 'hidden sm:table-cell')}>
                        {column.render(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {total !== undefined && total > pageSize && onPageChange && (
          <div className="border-t border-border p-3">
            <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
