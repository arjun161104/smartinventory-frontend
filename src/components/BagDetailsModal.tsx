import { useState, useMemo, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import type { InwardResponse } from "../api/inwardApi"
import { getAllDispatches, type DispatchResponse } from "../api/outwardApi"

type Props = {
  weighments: InwardResponse[]
  onClose: () => void
}

type CategoryKey = "nbgBags" | "ssgBags" | "swpBags" | "onbgBags" | "unbgBags"

const CATEGORIES: { key: CategoryKey; label: string }[] = [
  { key: "nbgBags", label: "NBG" },
  { key: "ssgBags", label: "SSG" },
  { key: "swpBags", label: "SWP" },
  { key: "onbgBags", label: "ONBG" },
  { key: "unbgBags", label: "UNBG" },
]

type Tab = "Available" | "Inward" | "Outward"

function sumInward(records: InwardResponse[]): Record<CategoryKey, number> {
  const r = { nbgBags: 0, ssgBags: 0, swpBags: 0, onbgBags: 0, unbgBags: 0 }
  records.forEach((w) => {
    CATEGORIES.forEach(({ key }) => { r[key] += w[key] ?? 0 })
  })
  return r
}

function sumOutward(records: DispatchResponse[]): Partial<Record<CategoryKey, number>> {
  const r: Partial<Record<CategoryKey, number>> = { ssgBags: 0, swpBags: 0, onbgBags: 0, unbgBags: 0 }
  records.forEach((d) => {
    if (d.ssgBags) r.ssgBags! += d.ssgBags
    if (d.swpBags) r.swpBags! += d.swpBags
    if (d.onbgBags) r.onbgBags! += d.onbgBags
    if (d.unbgBags) r.unbgBags! += d.unbgBags
  })
  return r
}

export default function BagDetailsModal({ weighments, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("Available")
  const [selectedVendor, setSelectedVendor] = useState("")

  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  const { data: dispatches = [] } = useQuery({
    queryKey: ["dispatches"],
    queryFn: () => getAllDispatches(),
  })

  const vendors = useMemo(() => {
    const set = new Set<string>()
    weighments.forEach((w) => { if (w.vendorName) set.add(w.vendorName) })
    dispatches.forEach((d) => { if (d.customerName) set.add(d.customerName) })
    return Array.from(set).sort()
  }, [weighments, dispatches])

  const filteredInward = useMemo(() => {
    if (!selectedVendor) return weighments
    return weighments.filter((w) => w.vendorName === selectedVendor)
  }, [weighments, selectedVendor])

  const filteredOutward = useMemo(() => {
    if (!selectedVendor) return dispatches
    return dispatches.filter((d) => d.customerName === selectedVendor)
  }, [dispatches, selectedVendor])

  const inwardTotals = useMemo(() => sumInward(filteredInward), [filteredInward])
  const outwardTotals = useMemo(() => sumOutward(filteredOutward), [filteredOutward])

  const availableTotals = useMemo((): Record<CategoryKey, number> => {
    const r: Record<CategoryKey, number> = { ...inwardTotals }
    CATEGORIES.forEach(({ key }) => {
      const out = outwardTotals[key] ?? 0
      r[key] = Math.max(0, r[key] - out)
    })
    return r
  }, [inwardTotals, outwardTotals])

  const currentTotals = useMemo((): Record<CategoryKey, number> => {
    if (tab === "Inward") return inwardTotals
    if (tab === "Outward") {
      return { nbgBags: 0, ssgBags: 0, swpBags: 0, onbgBags: 0, unbgBags: 0, ...outwardTotals }
    }
    return availableTotals
  }, [tab, inwardTotals, outwardTotals, availableTotals])

  const grandTotal = Object.values(currentTotals).reduce((a, b) => a + b, 0)

  const tabs: Tab[] = ["Available", "Inward", "Outward"]

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-lg border-b border-outline-variant sticky top-0 bg-white">
          <div>
            <h3 className="font-headline-sm text-headline-sm">Bag Details</h3>
            <p className="text-sm text-on-surface-variant">Category-wise bag count</p>
          </div>
          <button className="p-1.5 hover:bg-surface-container-low rounded" onClick={onClose}>
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="p-lg space-y-md text-sm">
          {/* Tab Filter: Available / Inward / Outward */}
          <div className="flex gap-1 bg-surface-container rounded-lg p-1">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-md font-label-md text-label-md transition-all cursor-pointer ${
                  tab === t
                    ? "bg-white text-primary shadow-sm font-bold"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* People Filter */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-label-md">Filter by People</label>
            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="w-full mt-1 border border-outline-variant rounded-lg px-3 py-2 font-body-md text-body-md bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All</option>
              {vendors.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          {/* Bag Badges */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-label-md mb-sm">Bag Breakdown</p>
            <div className="grid grid-cols-5 gap-sm text-center">
              {CATEGORIES.map(({ key, label }) => (
                <div key={key} className="bg-surface-container-lowest rounded p-sm border border-outline-variant">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase">{label}</p>
                  <p className="font-bold text-lg">{currentTotals[key]}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="border-t border-outline-variant pt-md flex justify-between items-center">
            <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-label-md">Total Bags</span>
            <span className="font-bold text-lg text-primary">{grandTotal.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>
    </div>
  )
}