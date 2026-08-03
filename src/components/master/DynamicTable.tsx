import type { ColumnConfig } from "../../config/masterConfig"

type Props = {
  columns: ColumnConfig[]
  tableKey: string
  data: Record<string, unknown>[]
  onView?: (row: Record<string, unknown>) => void
  onEdit: (row: Record<string, unknown>) => void
  onDelete: (row: Record<string, unknown>) => void
  onToggleStatus: (row: Record<string, unknown>) => void
}

export default function DynamicTable({ columns, tableKey, data, onView = () => {}, onEdit, onDelete, onToggleStatus }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead className="bg-surface-container-low">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-lg py-3 text-left font-label-md text-[11px] uppercase text-on-surface-variant border-b border-outline-variant whitespace-nowrap"
              >
                {col.label}
              </th>
            ))}
            <th className="px-lg py-3 text-left font-label-md text-[11px] uppercase text-on-surface-variant border-b border-outline-variant whitespace-nowrap">
              Status
            </th>
            <th className="px-lg py-3 text-center font-label-md text-[11px] uppercase text-on-surface-variant border-b border-outline-variant whitespace-nowrap">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant">
          {data.map((row, idx) => (
            <tr key={idx} className="hover:bg-surface-bright transition-colors cursor-default">
              {columns.map((col) => {
                const val = row[col.key]
                return (
                  <td key={col.key} className="px-lg py-4 font-body-md text-on-surface whitespace-nowrap">
                    {col.key === tableKey ? (
                      <span className="font-semibold text-primary">{String(val)}</span>
                    ) : (
                      String(val ?? "")
                    )}
                  </td>
                )
              })}
              <td className="px-lg py-4 whitespace-nowrap">
                <span
                  className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                    row.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {row.active ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-lg py-4 whitespace-nowrap">
                <div className="flex items-center justify-center gap-3">
                  <button
                    className="material-symbols-outlined text-[18px] text-on-surface-variant hover:text-primary transition-colors"
                    title="View"
                    onClick={() => onView?.(row)}
                  >
                    visibility
                  </button>
                  <button
                    className="material-symbols-outlined text-[18px] text-on-surface-variant hover:text-primary transition-colors"
                    title="Edit"
                    onClick={() => onEdit(row)}
                  >
                    edit
                  </button>
                  <button
                    className="material-symbols-outlined text-[18px] text-on-surface-variant hover:text-error transition-colors"
                    title="Delete"
                    onClick={() => onDelete(row)}
                  >
                    delete
                  </button>
                  <button
                    className={`material-symbols-outlined text-[18px] transition-colors ${
                      row.active ? "text-primary" : "text-on-surface-variant"
                    }`}
                    title="Toggle Status"
                    onClick={() => onToggleStatus(row)}
                  >
                    {row.active ? "toggle_on" : "toggle_off"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
