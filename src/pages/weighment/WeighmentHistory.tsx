import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import FilterBar from "../../components/FilterBar"
import { INWARD_HISTORY_FILTERS } from "../../config/inwardConfig"
import { getAllInwards } from "../../api/inwardApi"
import { useLookups } from "../../hooks/useLookup"
import { filterData } from "../../utils/filterData"

export default function WeighmentHistory() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<Record<string, string>>({})

  const { data: weighments = [], isLoading } = useQuery({
    queryKey: ["inwards"],
    queryFn: () => getAllInwards(),
  })

  const lookupNames = useMemo(
    () => INWARD_HISTORY_FILTERS.filter((f) => f.lookup).map((f) => f.lookup!),
    [],
  )
  const { lookups } = useLookups(lookupNames)

  const filteredRecords = useMemo(() => {
    return filterData(weighments, filters, INWARD_HISTORY_FILTERS)
  }, [weighments, filters])

  const handleFilterChange = (name: string, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-surface px-container-margin py-md space-y-md border-b border-outline-variant sticky top-0 z-40">
        <FilterBar filters={INWARD_HISTORY_FILTERS} values={filters} onChange={handleFilterChange} lookups={lookups} />
        <button
          className="text-primary font-label-md text-label-md hover:underline"
          onClick={() => setFilters({})}
        >
          Clear all filters
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-8 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
          <span className="font-body-sm">Loading weighments...</span>
        </div>
      )}

      <div className="px-container-margin py-md space-y-md flex-1">
        {filteredRecords.map((r) => (
          <div
            key={r.id}
            className="record-card bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="font-label-sm text-outline uppercase tracking-wider">Voucher No</span>
                <h3 className="font-title-md text-on-surface">{r.voucherNo}</h3>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-outline text-[18px]">calendar_today</span>
              <span className="text-body-sm text-on-surface-variant">
                {r.grossWeightTime ? new Date(r.grossWeightTime).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric",
                }) : "N/A"} | {r.grossWeightTime ?? "N/A"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-outline-variant/30">
              <div>
                <span className="font-label-sm text-outline block mb-1">Vehicle No</span>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px]">local_shipping</span>
                  <span className="font-body-md font-semibold text-on-surface">{r.vehicleNumber}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-label-sm text-outline block mb-1">Gross Weight</span>
                <span className="font-headline-sm font-bold text-primary">{r.grossWeight.toFixed(2)} MT</span>
              </div>
            </div>
          </div>
        ))}

        {!isLoading && (
          <div className="py-8 text-center">
            <p className="text-body-sm text-outline">
              {filteredRecords.length === 0 ? "No records found" : `Showing ${filteredRecords.length} of ${weighments.length} records`}
            </p>
          </div>
        )}
      </div>

      <button
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-primary-container text-on-primary-container shadow-lg hover:bg-primary transition-all active:scale-95 active:opacity-90"
        onClick={() => navigate("/weighmententry")}
        aria-label="New Entry"
      >
        <span className="material-symbols-outlined text-[28px]">add</span>
      </button>
    </div>
  )
}
