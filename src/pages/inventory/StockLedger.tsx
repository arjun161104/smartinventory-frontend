import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getStockLedgerPage, getStockLedgerSummary } from "../../api/inventoryApi"
import FilterBar from "../../components/FilterBar"
import KpiCard from "../../components/KpiCard"
import { STOCK_LEDGER_FILTERS, STOCK_LEDGER_SUMMARY, STOCK_LEDGER_COLUMNS } from "../../config/stockLedgerConfig"

const typeClassMap: Record<string, string> = {
  RECEIPT: "bg-secondary-container text-on-secondary-container",
  ISSUE: "bg-error-container text-on-error-container",
  PRODUCTION_YIELD: "bg-tertiary-container text-on-tertiary-container",
  ADJUSTMENT: "bg-surface-variant text-on-surface-variant",
}

const now = new Date()
const pad = (n: number) => String(n).padStart(2, "0")
const defaultDateFrom = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`
const defaultDateTo = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate())}`

export default function StockLedger() {
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    dateFrom: defaultDateFrom,
    dateTo: defaultDateTo,
  })
  const [page, setPage] = useState(0)
  const pageSize = 20

  const params: Record<string, unknown> = {}
  if (filterValues.itemId) params.itemId = Number(filterValues.itemId)
  if (filterValues.godownId) params.godownId = Number(filterValues.godownId)
  if (filterValues.dateFrom) params.dateFrom = filterValues.dateFrom
  if (filterValues.dateTo) params.dateTo = filterValues.dateTo
  if (filterValues.transactionType && filterValues.transactionType !== "All") {
    params.transactionType = filterValues.transactionType
  }
  params.page = page
  params.size = pageSize

  const { data: pageData, isLoading } = useQuery({
    queryKey: ["stock-ledger", params],
    queryFn: () => getStockLedgerPage(params),
    refetchInterval: 10_000,
    staleTime: 30_000,
  })

  const { data: summary } = useQuery({
    queryKey: ["stock-ledger-summary", filterValues],
    queryFn: () => getStockLedgerSummary(params),
    refetchInterval: 10_000,
    staleTime: 30_000,
  })

  const entries = pageData?.content ?? []
  const totalElements = pageData?.totalElements ?? 0
  const totalPages = pageData?.totalPages ?? 0

  const handleFilterChange = (name: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [name]: value }))
    setPage(0)
  }

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <div className="p-container-margin">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-lg gap-md">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface">Stock Ledger</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Detailed historical movement of inventory items</p>
          </div>
          <div className="flex gap-sm">
            <button className="flex items-center gap-xs px-4 py-2 bg-white border border-outline-variant text-on-surface-variant rounded-lg font-label-md text-label-md hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-[18px]">download</span> Export PDF
            </button>
          </div>
        </div>

        <div className="mb-lg">
          <FilterBar filters={STOCK_LEDGER_FILTERS} values={filterValues} onChange={handleFilterChange} />
        </div>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-md mb-lg">
          {STOCK_LEDGER_SUMMARY.map((card) => (
            <KpiCard
              key={card.title}
              config={card}
              value={summary ? String(summary[card.apiField as keyof typeof summary] ?? 0) : "—"}
            />
          ))}
        </section>

        <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <span className="material-symbols-outlined text-4xl text-outline-variant animate-spin">progress_activity</span>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl mb-md">inventory_2</span>
              <p className="font-body-lg text-body-lg">No stock ledger entries found</p>
              <p className="font-body-sm text-body-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-high">
                    {STOCK_LEDGER_COLUMNS.map((col) => (
                      <th
                        key={col.key}
                        className={`px-md py-3 font-label-md text-label-md text-on-surface-variant uppercase ${
                          col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : ""
                        }`}
                      >
                        {col.label}
                      </th>
                    ))}
                    <th className="px-md py-3 font-label-md text-label-md text-on-surface-variant uppercase text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-surface-container-low transition-colors group">
                      {STOCK_LEDGER_COLUMNS.map((col) => {
                        const val = entry[col.key as keyof typeof entry]
                        if (col.key === "transactionType") {
                          return (
                            <td key={col.key} className="px-md py-4 text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${typeClassMap[val as string] ?? ""}`}>
                                {val as string}
                              </span>
                            </td>
                          )
                        }
                        if (col.key === "inwardQty" || col.key === "outwardQty" || col.key === "balanceQty") {
                          return (
                            <td key={col.key} className={`px-md py-4 font-body-md text-body-md font-bold text-right ${
                              col.key === "inwardQty" ? "text-secondary" : col.key === "outwardQty" ? "text-error" : ""
                            }`}>
                              {typeof val === "number" ? val.toFixed(2) : val}
                            </td>
                          )
                        }
                        return (
                          <td
                            key={col.key}
                            className={`px-md py-4 font-body-md text-body-md ${
                              col.key === "referenceNo" ? "text-primary font-medium" : ""
                            } ${
                              col.key === "balanceQty" ? "font-semibold" : ""
                            } ${
                              col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : ""
                            }`}
                          >
                            {val != null ? String(val) : ""}
                          </td>
                        )
                      })}
                      <td className="px-md py-4 text-center">
                        <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">visibility</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {totalPages > 0 && (
          <div className="px-md py-3 bg-surface-container-low border border-t-0 border-outline-variant rounded-b-xl flex items-center justify-between">
            <span className="text-label-sm font-label-sm text-on-surface-variant">
              Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalElements)} of {totalElements} entries
            </span>
            <div className="flex gap-2">
              <button
                className="p-1 border border-outline-variant rounded hover:bg-white transition-colors disabled:opacity-50"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <button
                className="p-1 border border-outline-variant rounded hover:bg-white transition-colors disabled:opacity-50"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

