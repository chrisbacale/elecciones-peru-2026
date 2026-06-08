"use client";

import { cn } from "@/lib/utils";

export type ResponsiveColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
  mobileLabel?: string;
};

export function ResponsiveTable<T>({
  data,
  columns,
  keyExtractor,
  caption,
  mobileCardClassName,
}: {
  data: T[];
  columns: ResponsiveColumn<T>[];
  keyExtractor: (row: T) => string;
  caption?: string;
  mobileCardClassName?: string;
}) {
  return (
    <>
      <div className="hidden md:block overflow-x-auto rounded-xl border border-card-border">
        <table className="w-full text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="bg-accent/45 text-left text-xs uppercase tracking-wider text-muted">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn("px-4 py-3 font-medium", col.className)}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-card-border">
            {data.map((row) => (
              <tr
                key={keyExtractor(row)}
                className="transition-colors hover:bg-accent/40"
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn("px-4 py-3", col.className)}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        {data.map((row) => (
          <dl
            key={keyExtractor(row)}
            className={cn(
              "rounded-xl border border-card-border bg-card p-4 space-y-2",
              mobileCardClassName
            )}
          >
            {columns.map((col) => (
              <div key={col.key} className="grid gap-1 text-sm">
                <dt className="text-xs font-medium uppercase tracking-wider text-muted">
                  {col.mobileLabel ?? col.header}
                </dt>
                <dd className={cn("min-w-0 font-medium text-foreground", col.className)}>
                  {col.render(row)}
                </dd>
              </div>
            ))}
          </dl>
        ))}
      </div>
    </>
  );
}
