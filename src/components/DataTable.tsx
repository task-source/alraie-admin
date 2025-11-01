import React, { ReactNode } from "react";
import clsx from "clsx";

export interface DataTableColumn<T> {
  key: keyof T | string; // Key for data lookup
  label: string; // Column header
  className?: string; // Custom column class
  render?: (item: T) => ReactNode; // Custom cell renderer
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  onRowClick?: (item: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  onRowClick,
  loading = false,
  emptyMessage = "No data found",
  className = "",
}: DataTableProps<T>) {
  return (
    <div
      className={clsx(
        "overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]",
        className
      )}
    >
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[640px]">
          <table className="w-full text-sm text-left">
            {/* Table Header */}
            <thead className="border-b border-gray-100 dark:border-white/[0.05] bg-gray-50 dark:bg-gray-800/40">
              <tr>
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    className={clsx(
                      "px-5 py-3 font-medium text-gray-500 text-theme-xs whitespace-nowrap dark:text-gray-400",
                      col.className
                    )}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    Loading...
                  </td>
                </tr>
              ) : data.length > 0 ? (
                data.map((item, index) => (
                  <tr
                    key={index}
                    onClick={() => onRowClick?.(item)}
                    className={clsx(
                      "hover:bg-gray-50 dark:hover:bg-gray-800/60 transition cursor-pointer",
                      onRowClick && "cursor-pointer"
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={String(col.key)}
                        className={clsx(
                          "px-5 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap",
                          col.className
                        )}
                      >
                        {col.render ? col.render(item) : (item as any)[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
