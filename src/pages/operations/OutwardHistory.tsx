import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import FilterBar from "../../components/FilterBar"
import { OUTWARD_HISTORY_FILTERS } from "../../config/outwardConfig"
import { getAllDispatches, type DispatchResponse } from "../../api/outwardApi"
import { useLookups } from "../../hooks/useLookup"
import PageHeader from "../../components/PageHeader"
import { filterData } from "../../utils/filterData"

declare const XLSX: {
  utils: {
    book_new(): unknown
    aoa_to_sheet(data: (string | number)[][]): unknown
    book_append_sheet(wb: unknown, ws: unknown, name: string): void
  }
  writeFile(wb: unknown, filename: string): void
}

const sidebarLinks = [
  { icon: "dashboard", label: "Dashboard", path: "/dashboard" },
  { icon: "database", label: "Masters", path: "/masters" },
  { icon: "precision_manufacturing", label: "Operations", path: "/operations", active: true },
  { icon: "inventory_2", label: "Inventory", path: "/inventory" },
  { icon: "account_balance", label: "Accounts", path: "/accounts" },
  { icon: "assessment", label: "Reports", path: "/reports" },
  { icon: "settings", label: "Settings", path: "/settings" },
]

export default function OutwardHistory() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [viewEntry, setViewEntry] = useState<DispatchResponse | null>(null)

  useEffect(() => {
    if (viewEntry) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [viewEntry])

  const { data: dispatches = [], isLoading } = useQuery({
    queryKey: ["dispatches"],
    queryFn: () => getAllDispatches(),
    refetchInterval: 10_000,
    staleTime: 30_000,
  })

  const lookupNames = useMemo(
    () => OUTWARD_HISTORY_FILTERS.filter((f) => f.lookup).map((f) => f.lookup!),
    [],
  )
  const { lookups } = useLookups(lookupNames)

  const filteredRecords = useMemo(() => {
    return filterData(dispatches, filters, OUTWARD_HISTORY_FILTERS)
  }, [dispatches, filters])

  const handleFilterChange = (name: string, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const exportToExcel = () => {
    if (typeof XLSX === "undefined") {
      const s = document.createElement("script")
      s.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"
      s.onload = () => exportToExcel()
      document.head.appendChild(s)
      return
    }
    const fmt = (val: unknown, decimals?: number) => {
      if (val == null || val === "") return "-"
      const n = Number(val)
      if (isNaN(n)) return String(val)
      return decimals != null ? n.toFixed(decimals) : String(n)
    }
    const bag = (val: unknown) => (val != null && Number(val) > 0 ? String(Number(val)) : "-")

    const aoa: (string | number)[][] = [[
      "Dispatch No", "Customer", "Vehicle", "Gross Wt (kg)", "Tare Wt (kg)",
      "Net Wt (kg)", "Site", "Warehouse", "Item", "Dispatch Date",
      "ONBG", "UNBG", "SSG", "SWP",
    ]]
    filteredRecords.forEach((r) => {
      aoa.push([
        fmt(r.dispatchNo), fmt(r.customerName), fmt(r.vehicleNumber),
        fmt(r.grossWeight, 2), fmt(r.tareWeight, 2), fmt(r.netWeight, 2),
        fmt(r.siteName), fmt(r.warehouseName), fmt(r.itemName),
        fmt(r.dispatchDate),
        bag(r.onbgBags), bag(r.unbgBags), bag(r.ssgBags), bag(r.swpBags),
      ])
    })

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(aoa)
    XLSX.utils.book_append_sheet(wb, ws, "Outward")
    XLSX.writeFile(wb, `outward-history-${new Date().toISOString().split("T")[0]}.xlsx`)
  }

  const dashboardStats = useMemo(() => {
    const today = new Date().toDateString()
    const todayEntries = dispatches.filter((d) => d.createdAt && new Date(d.createdAt).toDateString() === today)
    return {
      totalDispatched: dispatches.reduce((s, d) => s + (d.netWeight || d.grossWeight || 0), 0),
      todayDispatched: todayEntries.reduce((s, d) => s + (d.netWeight || d.grossWeight || 0), 0),
      todayDispatchCount: todayEntries.length,
    }
  }, [dispatches])

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-container-margin h-14 bg-surface border-b border-outline-variant">
        <div className="flex items-center gap-md">
          <button className="material-symbols-outlined text-primary hover:bg-surface-container-high transition-colors p-2 rounded-full" onClick={() => setSidebarOpen(v => !v)}>
            menu
          </button>
          <h1 className="font-headline-sm text-headline-sm font-bold text-primary">SmartInventory</h1>
        </div>
        <div className="flex items-center gap-md">
          <button className="material-symbols-outlined text-on-surface-variant hover:bg-surface-container-high transition-colors p-2 rounded-full">search</button>
          <button className="material-symbols-outlined text-on-surface-variant hover:bg-surface-container-high transition-colors p-2 rounded-full">notifications</button>
          <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs">AD</div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 bottom-0 z-[60] flex flex-col py-lg w-64 bg-surface-container-lowest border-r border-outline-variant transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 transition-transform duration-300`}>
        <div className="px-lg mb-xl">
          <h2 className="font-headline-sm text-headline-sm font-bold text-primary">SmartInventory ERP</h2>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {sidebarLinks.map((item) => (
            <a
              key={item.label}
              className={`flex items-center gap-md mx-2 px-4 py-3 rounded-full transition-all cursor-pointer ${
                item.active
                  ? "bg-primary-container text-on-primary-container font-bold"
                  : "text-on-surface-variant hover:bg-surface-container"
              }`}
              onClick={() => navigate(item.path)}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-label-md text-label-md">{item.label}</span>
            </a>
          ))}
        </nav>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-[55] bg-black/30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <main className="md:ml-64 pt-20 pb-32 px-container-margin space-y-lg">
        <PageHeader
          title="Outward History"
          subtitle="View and manage historical dispatch records."
          breadcrumb={[
            { label: "Operations", path: "/operations" },
            { label: "Rice Mill ERP", path: "/operations/outward" },
            { label: "Outward History" },
          ]}
          actions={[
            <button key="new" className="bg-primary text-on-primary px-6 h-10 rounded-lg flex items-center gap-2 font-label-md text-label-md hover:opacity-90 transition-all active:scale-95 shadow-sm" onClick={() => navigate("/operations/outward")}>
              <span className="material-symbols-outlined">add</span>
              New Dispatch
            </button>,
            <button key="export" className="bg-surface-container border border-outline-variant text-on-surface-variant px-4 h-10 rounded-lg flex items-center gap-2 font-label-md text-label-md hover:bg-surface-container-high transition-colors" onClick={exportToExcel}>
              <span className="material-symbols-outlined">file_download</span>
              Export
            </button>,
          ]}
        />

        {/* Filters */}
        <div className="bg-white border border-outline-variant p-4 rounded-xl shadow-sm">
          <FilterBar filters={OUTWARD_HISTORY_FILTERS} values={filters} onChange={handleFilterChange} lookups={lookups} />
          <button
            className="text-primary font-label-md text-label-md hover:underline mt-2"
            onClick={() => setFilters({})}
          >
            Clear all filters
          </button>
        </div>

        {/* Table */}
        <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-surface-container text-on-surface-variant border-b border-outline-variant">
                  <th className="px-4 py-3 font-label-md text-label-md uppercase tracking-wider">Dispatch No</th>
                  <th className="px-4 py-3 font-label-md text-label-md uppercase tracking-wider">Customer & Location</th>
                  <th className="px-4 py-3 font-label-md text-label-md uppercase tracking-wider">Vehicle</th>
                  <th className="px-4 py-3 font-label-md text-label-md uppercase tracking-wider text-right">Gross Wt (kg)</th>
                  <th className="px-4 py-3 font-label-md text-label-md uppercase tracking-wider text-right">Net Wt (kg)</th>
                  <th className="px-4 py-3 font-label-md text-label-md uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {isLoading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-on-surface-variant">Loading records...</td></tr>
                ) : filteredRecords.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-on-surface-variant">No records found</td></tr>
                ) : (
                  filteredRecords.map((row) => (
                    <tr key={row.id} className="hover:bg-surface transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-title-md text-title-md text-on-surface">{row.dispatchNo}</div>
                        <div className="font-label-sm text-label-sm text-on-surface-variant">
                          {row.dispatchDate ? new Date(row.dispatchDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-body-md text-body-md font-semibold">{row.customerName}</div>
                        <div className="font-label-sm text-label-sm text-on-surface-variant">{row.siteName}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-on-surface-variant">local_shipping</span>
                          <span className="font-body-md text-body-md">{row.vehicleNumber ?? "—"}</span>
                        </div>
                        <div className="font-label-sm text-label-sm text-on-surface-variant">{row.warehouseName}</div>
                      </td>
                      <td className="px-4 py-4 text-right font-body-md text-body-md font-medium">
                        {row.grossWeight.toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        {row.netWeight !== null ? (
                          <span className="font-body-md text-body-md font-bold text-primary">{row.netWeight.toFixed(2)}</span>
                        ) : (
                          <span className="font-body-md text-body-md italic text-on-surface-variant">Pending Tare...</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end items-center gap-1">
                          <button className="p-1.5 hover:bg-surface-container-low rounded" onClick={() => setViewEntry(row)} title="View Details">
                            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">visibility</span>
                          </button>
                          <button className="p-1.5 hover:bg-surface-container-low rounded" onClick={() => navigate("/operations/outward", { state: { editEntry: row } })} title="Edit Dispatch">
                            <span className="material-symbols-outlined text-[18px] text-primary">edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-surface-container-lowest px-4 py-3 flex items-center justify-between border-t border-outline-variant">
            <div className="font-label-sm text-label-sm text-on-surface-variant">
              Showing <span className="font-bold text-on-surface">{filteredRecords.length}</span> of <span className="font-bold text-on-surface">{dispatches.length}</span> entries
            </div>
          </div>
        </div>

        {/* Dashboard Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-8">
          <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm relative overflow-hidden group">
            <div className="relative z-10">
              <div className="text-on-surface-variant font-label-md text-label-md mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600 text-lg">local_shipping</span>
                TOTAL DISPATCHED QUANTITY
              </div>
              <div className="text-3xl font-extrabold text-on-surface">{(dashboardStats.totalDispatched / 1000).toFixed(2)} <span className="text-sm font-medium text-on-surface-variant">MT</span></div>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
              <span className="material-symbols-outlined text-[120px] text-amber-600">timer</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm relative overflow-hidden group">
            <div className="relative z-10">
              <div className="text-on-surface-variant font-label-md text-label-md mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">arrow_upward</span>
                TODAY DISPATCHED QUANTITY
              </div>
              <div className="text-3xl font-extrabold text-on-surface">{(dashboardStats.todayDispatched / 1000).toFixed(2)} <span className="text-sm font-medium text-on-surface-variant">MT</span></div>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
              <span className="material-symbols-outlined text-[120px] text-primary">conveyor_belt</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm relative overflow-hidden group">
            <div className="relative z-10">
              <div className="text-on-surface-variant font-label-md text-label-md mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-lg">check_circle</span>
                TOTAL DISPATCHES TODAY
              </div>
              <div className="text-3xl font-extrabold text-on-surface">{dashboardStats.todayDispatchCount} <span className="text-sm font-medium text-on-surface-variant">Entries</span></div>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
              <span className="material-symbols-outlined text-[120px] text-secondary">warehouse</span>
            </div>
          </div>
        </div>
      </main>

      {/* View Entry Modal */}
      {viewEntry && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" onClick={() => setViewEntry(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-lg border-b border-outline-variant sticky top-0 bg-white">
              <div>
                <h3 className="font-headline-sm text-headline-sm">Dispatch Details</h3>
                <p className="text-sm text-on-surface-variant">{viewEntry.dispatchNo}</p>
              </div>
              <button className="p-1.5 hover:bg-surface-container-low rounded" onClick={() => setViewEntry(null)}>
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            <div className="p-lg space-y-md text-sm">
              <div className="grid grid-cols-2 gap-md">
                <DetailField label="Dispatch No" value={viewEntry.dispatchNo} />
                <DetailField label="Transaction No" value={viewEntry.transactionNo} />
                <DetailField label="Customer" value={viewEntry.customerName} />
                <DetailField label="Vehicle" value={viewEntry.vehicleNumber ?? "—"} />
                <DetailField label="Driver" value={viewEntry.driverName ?? "—"} />
                <DetailField label="Item" value={viewEntry.itemName ?? "—"} />
                <DetailField label="Item Code" value={viewEntry.itemCode ?? "—"} />
                <DetailField label="Site" value={viewEntry.siteName ?? "—"} />
                <DetailField label="Warehouse" value={viewEntry.warehouseName ?? "—"} />
                <DetailField label="Dispatch Date" value={viewEntry.dispatchDate ?? "—"} />
                <DetailField label="Sample No" value={viewEntry.sampleNo ?? "—"} />
                <DetailField label="FRK Required" value={viewEntry.frkRequired ? "Yes" : "No"} />
                <DetailField label="Truck Memo No" value={viewEntry.truckMemoNo ?? "—"} />
                <DetailField label="Truck Memo Date" value={viewEntry.truckMemoDate ?? "—"} />
                <DetailField label="Ack No" value={viewEntry.ackNo ?? "—"} />
                <DetailField label="Ack Date" value={viewEntry.ackDate ?? "—"} />
                <DetailField label="Gross Weight" value={`${viewEntry.grossWeight.toFixed(2)} kg`} />
                <DetailField label="Tare Weight" value={viewEntry.tareWeight != null ? `${viewEntry.tareWeight.toFixed(2)} kg` : "—"} />
                <DetailField label="Net Weight" value={viewEntry.netWeight != null ? `${viewEntry.netWeight.toFixed(2)} kg` : "—"} />
              </div>
              <div className="border-t border-outline-variant pt-md">
                <DetailField label="Remarks / Internal Notes" value={viewEntry.remarks ?? "—"} />
              </div>
              <div className="border-t border-outline-variant pt-md">
                <p className="font-label-md text-label-md text-on-surface-variant mb-sm">Bag Breakdown</p>
                <div className="grid grid-cols-4 gap-sm text-center">
                  <BagBadge label="ONBG" value={viewEntry.onbgBags ?? 0} />
                  <BagBadge label="UNBG" value={viewEntry.unbgBags ?? 0} />
                  <BagBadge label="SSG" value={viewEntry.ssgBags ?? 0} />
                  <BagBadge label="SWP" value={viewEntry.swpBags ?? 0} />
                </div>
              </div>
              <div className="border-t border-outline-variant pt-md grid grid-cols-2 gap-md text-[11px] text-on-surface-variant">
                <DetailField label="Created By" value={viewEntry.createdBy} />
                <DetailField label="Created At" value={viewEntry.createdAt ? new Date(viewEntry.createdAt).toLocaleString() : "—"} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-label-md">{label}</span>
      <span className="font-bold text-on-surface">{value}</span>
    </div>
  )
}

function BagBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-surface-container-lowest rounded p-sm border border-outline-variant">
      <p className="text-[10px] text-on-surface-variant font-bold uppercase">{label}</p>
      <p className="font-bold text-lg">{value}</p>
    </div>
  )
}

