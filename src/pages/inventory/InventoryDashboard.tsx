import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { INVENTORY_CATEGORIES, INVENTORY_MOVEMENT_COLUMNS } from "../../config/inventoryConfig"
import { getInventorySummary, getStockLedgerPage } from "../../api/inventoryApi"
import type { StockLedgerRecord } from "../../api/inventoryApi"

const TYPE_TO_CATEGORY: Record<string, string> = {
  RAW_MATERIAL: "paddy",
  FINISHED_GOOD: "rice",
  BYPRODUCT: "husk",
  CONSUMABLE: "packaging",
}

const DISPLAY_UOM: Record<string, string> = {
  CONSUMABLE: "Bags",
}

const fallbackSummary: Record<string, unknown> = {
  RAW_MATERIAL_stock: 0,
  RAW_MATERIAL_uom: "KG",
  FINISHED_GOOD_stock: 0,
  FINISHED_GOOD_uom: "KG",
  BYPRODUCT_stock: 0,
  BYPRODUCT_uom: "KG",
  CONSUMABLE_stock: 0,
  CONSUMABLE_uom: "Bags",
}

function fmtStock(val: unknown, uom: string): string {
  const n = Number(val) || 0
  if (uom === "KG" && Math.abs(n) >= 1000) return `${(n / 1000).toLocaleString("en-IN", { maximumFractionDigits: 1 })} Tons`
  return `${n.toLocaleString("en-IN")} ${uom || "Units"}`
}

function fmtPct(summary: Record<string, unknown>, typeKey: string): string {
  const stock = Number(summary[`${typeKey}_stock`]) || 0
  const total = ["RAW_MATERIAL", "FINISHED_GOOD", "BYPRODUCT", "CONSUMABLE"].reduce((s, t) => s + (Number(summary[`${t}_stock`]) || 0), 0)
  if (total <= 0) return "0%"
  return `${Math.round(Math.abs(stock / total) * 100)}%`
}

const transactionClassMap: Record<string, string> = {
  RECEIPT: "bg-secondary-container text-on-secondary-container",
  ISSUE: "bg-error-container text-on-error-container",
  PRODUCTION_YIELD: "bg-tertiary-container text-on-tertiary-container",
  ADJUSTMENT: "bg-surface-variant text-on-surface-variant",
}

function toMovement(entry: StockLedgerRecord) {
  const isIn = entry.inwardQty > 0
  const qty = isIn ? entry.inwardQty : entry.outwardQty
  return {
    timestamp: entry.date ? new Date(entry.date).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—",
    itemCode: entry.itemCode,
    itemName: entry.itemName,
    quantity: `${isIn ? "+" : "-"}${qty.toFixed(2)} ${entry.uom}`,
    warehouse: entry.godownName ?? "—",
    status: entry.transactionType,
    qtyClass: isIn ? "text-secondary" : "text-error",
    statusClass: transactionClassMap[entry.transactionType] ?? "bg-surface-container-high text-on-surface-variant",
  }
}

type DateFilter = "All" | "Monthly" | "Weekly" | "Today"

function getDateParams(filter: DateFilter): Record<string, string> {
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, "0")
  const dd = String(today.getDate()).padStart(2, "0")
  const todayStr = `${yyyy}-${mm}-${dd}`

  if (filter === "Today") return { dateFrom: todayStr, dateTo: todayStr }

  if (filter === "Weekly") {
    const d = new Date(today)
    d.setDate(d.getDate() - 6)
    const from = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    return { dateFrom: from, dateTo: todayStr }
  }

  if (filter === "Monthly") {
    const firstDay = `${yyyy}-${mm}-01`
    return { dateFrom: firstDay, dateTo: todayStr }
  }

  return {}
}

export default function InventoryDashboard() {
  const navigate = useNavigate()
  const [dateFilter, setDateFilter] = useState<DateFilter>("All")

  const { data: inventorySummary } = useQuery({
    queryKey: ["inventory-summary-dash"],
    queryFn: () => getInventorySummary(),
    refetchInterval: 10_000,
    staleTime: 30_000,
  })

  const ledgerParams = useMemo(() => ({ size: 5, ...getDateParams(dateFilter) }), [dateFilter])
  const { data: ledgerPage } = useQuery({
    queryKey: ["inventory-ledger-recent", dateFilter],
    queryFn: () => getStockLedgerPage(ledgerParams),
    refetchInterval: 10_000,
    staleTime: 30_000,
  })

  const summary = (inventorySummary ?? fallbackSummary) as Record<string, unknown>

  const categoryData = useMemo(() => {
    const total = ["RAW_MATERIAL", "FINISHED_GOOD", "BYPRODUCT", "CONSUMABLE"].reduce(
      (s, t) => s + Math.abs(Number(summary[`${t}_stock`]) || 0), 0
    ) || 1
    const map: Record<string, { tons: string; pct: string; barClass: string }> = {}
    for (const cat of INVENTORY_CATEGORIES) {
      const typeKey = Object.entries(TYPE_TO_CATEGORY).find(([, v]) => v === cat.apiField)?.[0]
      if (typeKey) {
        const stock = Number(summary[`${typeKey}_stock`]) || 0
        const uom = DISPLAY_UOM[typeKey] ?? String(summary[`${typeKey}_uom`] ?? "KG")
        let barClass = cat.barClass
        if (typeKey === "FINISHED_GOOD") {
          barClass = stock >= 0 ? "bg-primary" : "bg-error"
        }
        const pctVal = Math.round((Math.abs(stock) / total) * 100)
        map[cat.apiField] = {
          tons: fmtStock(stock, uom),
          pct: `${Math.max(pctVal, stock !== 0 ? 2 : 0)}%`,
          barClass,
        }
      } else {
        map[cat.apiField] = { tons: "—", pct: "0%", barClass: cat.barClass }
      }
    }
    return map
  }, [summary])

  const movements = useMemo(() => {
    const entries = ledgerPage?.content ?? []
    return [...entries].reverse().map(toMovement)
  }, [ledgerPage])

  const rawMaterialStock = Number(summary.RAW_MATERIAL_stock) || 0
  const rawMaterialUom = String(summary.RAW_MATERIAL_uom ?? "KG")
  const rawMaterialOutward = Number(summary.RAW_MATERIAL_outward) || 0
  const finishedGoodOutward = Number(summary.FINISHED_GOOD_outward) || 0
  const finishedGoodUom = String(summary.FINISHED_GOOD_uom ?? "KG")

  const totalStockLabel = fmtStock(rawMaterialStock, rawMaterialUom)
  const paddyDispatchedLabel = fmtStock(rawMaterialOutward, rawMaterialUom)
  const riceDispatchedLabel = fmtStock(finishedGoodOutward, finishedGoodUom)
  const totalPct = fmtPct(summary, "RAW_MATERIAL")
  const paddyDispPct = fmtPct(summary, "RAW_MATERIAL")
  const riceDispPct = fmtPct(summary, "FINISHED_GOOD")

  return (
    <div className="bg-background text-on-background min-h-screen">
      <div className="pt-4 px-container-margin max-w-7xl mx-auto space-y-lg">
        {/* Row 1: Three KPI-style cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          <div className="bg-surface-container-lowest border border-outline-variant p-lg rounded-xl shadow-sm flex flex-col justify-between group transition-all hover:border-primary">
            <div className="flex justify-between items-start mb-md">
              <div className="p-3 bg-primary-container rounded-lg text-on-primary-container">
                <span className="material-symbols-outlined">warehouse</span>
              </div>
              <span className="text-secondary font-label-md">{totalPct}</span>
            </div>
            <div>
              <p className="font-label-md text-on-surface-variant mb-xs">Total Stock</p>
              <h2 className="font-display-lg text-display-lg text-on-surface">{totalStockLabel}</h2>
              <p className="font-body-sm text-outline mt-xs">Paddy available</p>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant p-lg rounded-xl shadow-sm flex flex-col justify-between transition-all hover:border-tertiary">
            <div className="flex justify-between items-start mb-md">
              <div className="p-3 bg-tertiary-container rounded-lg text-on-tertiary-container">
                <span className="material-symbols-outlined">local_shipping</span>
              </div>
              <span className="text-tertiary font-label-md">{paddyDispPct}</span>
            </div>
            <div>
              <p className="font-label-md text-on-surface-variant mb-xs">Paddy Dispatched</p>
              <h2 className="font-display-lg text-display-lg text-on-surface">{paddyDispatchedLabel}</h2>
              <p className="font-body-sm text-outline mt-xs">Total dispatched outward</p>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant p-lg rounded-xl shadow-sm flex flex-col justify-between transition-all hover:border-error">
            <div className="flex justify-between items-start mb-md">
              <div className="p-3 bg-error-container rounded-lg text-error">
                <span className="material-symbols-outlined">conveyor_belt</span>
              </div>
              <span className="text-error font-label-md">{riceDispPct}</span>
            </div>
            <div>
              <p className="font-label-md text-on-surface-variant mb-xs">Rice Dispatched</p>
              <h2 className="font-display-lg text-display-lg text-on-surface">{riceDispatchedLabel}</h2>
              <p className="font-body-sm text-outline mt-xs">Total dispatched outward</p>
            </div>
          </div>
        </div>

        {/* Row 2: Stock by Category + Inventory Optimization */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
          <section className="lg:col-span-7 bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
            <div className="px-lg py-md border-b border-outline-variant flex justify-between items-center">
              <h3 className="font-title-md text-title-md text-on-surface">Stock by Category</h3>
              <button className="text-primary font-label-md hover:underline">Manage Categories</button>
            </div>
            <div className="p-lg space-y-md">
              {INVENTORY_CATEGORIES.map((cat) => {
                const data = categoryData[cat.apiField] ?? { tons: "—", pct: "0%", barClass: cat.barClass }
                return (
                  <div key={cat.name} className="space-y-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-body-md text-on-surface">{cat.name}</span>
                      <span className="font-label-md text-on-surface">{data.tons}</span>
                    </div>
                    <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${data.barClass}`} style={{ width: data.pct }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="lg:col-span-5 bg-primary-container text-on-primary-container rounded-xl overflow-hidden relative min-h-[300px] flex flex-col justify-end p-lg">
            <div className="absolute top-0 left-0 w-full h-full opacity-30 mix-blend-overlay">
              <img className="w-full h-full object-cover" alt="Silos" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDkWg1o04HZS0j0HWfqYyaoEdAkhk-0WR17V-C4Rcsd66drvP5JknkR88pBxrGgUPAhFck-qcJ9jf-wvQzDcvGyQAZ45QSiwVcDwiC-FKR8qF2SiLFs3kQboNP2kDfnMHz7hJhgbdj9IGqFHPNzjz6Sw24Eh13JQLS-dkRWPLWCiTV0a367rWPdKxb0UW1HUH_iHzAcqL88EaDm9mJRA2tQ-Pf2GDrozIyb1yGrpBrmrfmpv8TlxzCcyGJNGMCUBvGVf4OIhMrr2mY" />
            </div>
            <div className="relative z-10 space-y-md">
              <h4 className="font-headline-sm text-headline-sm">Inventory Optimization</h4>
              <p className="font-body-md opacity-90">Current storage efficiency is at 84%. Predicted inflow suggests increasing capacity for Grade-A Paddy by Friday.</p>
              <button className="bg-on-primary-container text-primary-container px-lg py-3 rounded-lg font-label-md font-bold hover:opacity-90 transition-all flex items-center gap-xs">
                <span className="material-symbols-outlined">analytics</span>
                View Detailed Forecast
              </button>
            </div>
          </section>
        </div>

        {/* Row 3: Recent Stock Movements */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
          <div className="px-lg py-md border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
            <h3 className="font-title-md text-title-md text-on-surface">Recent Stock Movements</h3>
            <div className="flex items-center gap-md">
              <div className="flex gap-sm">
                <span className="flex items-center gap-xs text-on-surface-variant font-label-sm">
                  <span className="w-2 h-2 rounded-full bg-secondary" /> Addition
                </span>
                <span className="flex items-center gap-xs text-on-surface-variant font-label-sm">
                  <span className="w-2 h-2 rounded-full bg-error" /> Subtraction
                </span>
              </div>
              <select
                className="px-3 py-1.5 bg-surface border border-outline-variant rounded-lg text-on-surface font-label-md cursor-pointer focus:outline-none focus:border-primary transition-colors"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilter)}
              >
                <option value="All">All</option>
                <option value="Monthly">Monthly</option>
                <option value="Weekly">Weekly</option>
                <option value="Today">Today</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low text-on-surface-variant">
                <tr>
                  {INVENTORY_MOVEMENT_COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      className={`px-lg py-md font-label-md uppercase tracking-wider ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : ""}`}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-lg py-8 text-center text-on-surface-variant font-body-sm">
                      No stock movements recorded yet.
                    </td>
                  </tr>
                ) : (
                  movements.map((m, idx) => (
                    <tr key={idx} className="hover:bg-surface-container transition-colors group">
                      {INVENTORY_MOVEMENT_COLUMNS.map((col) => {
                        const val = m[col.key as keyof typeof m]
                        if (col.key === "quantity") {
                          return <td key={col.key} className={`px-lg py-md font-body-md font-bold ${m.qtyClass}`}>{val}</td>
                        }
                        if (col.key === "status") {
                          return (
                            <td key={col.key} className="px-lg py-md text-right">
                              <span className={`px-3 py-1 rounded-full font-label-sm ${m.statusClass}`}>{val}</span>
                            </td>
                          )
                        }
                        return (
                          <td
                            key={col.key}
                            className={`px-lg py-md ${
                              col.key === "itemCode" ? "font-label-md text-primary" :
                              col.key === "itemName" ? "font-body-md font-medium" :
                              col.key === "timestamp" ? "font-body-sm" :
                              "font-body-sm"
                            }`}
                          >
                            {val}
                          </td>
                        )
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-lg py-md bg-surface-container-low border-t border-outline-variant flex justify-end">
            <button className="text-primary font-label-md flex items-center gap-xs hover:opacity-80 transition-all" onClick={() => navigate("/inventory/stockledger")}>
              View Complete History <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </section>
      </div>

      {/* FAB: Update Stock */}
      <div className="fixed bottom-6 right-container-margin z-[40]">
        <button className="w-14 h-14 bg-primary text-on-primary rounded-xl shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all group">
          <span className="material-symbols-outlined text-[28px]">add</span>
          <span className="absolute right-full mr-4 bg-inverse-surface text-inverse-on-surface px-md py-1.5 rounded-lg text-label-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md pointer-events-none">Update Stock</span>
        </button>
      </div>
    </div>
  )
}
