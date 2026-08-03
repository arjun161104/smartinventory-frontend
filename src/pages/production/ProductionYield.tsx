import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getAllBatches, getYieldsByBatchId } from "../../api/productionApi"

export default function ProductionYield() {
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null)

  const { data: batchesPage } = useQuery({
    queryKey: ["production-batches-list"],
    queryFn: () => getAllBatches({ page: 0, size: 100 }),
    refetchInterval: 10_000,
    staleTime: 30_000,
  })

  const batches = batchesPage?.content ?? []

  const { data: yields } = useQuery({
    queryKey: ["production-yields", selectedBatchId],
    queryFn: () => (selectedBatchId ? getYieldsByBatchId(selectedBatchId) : Promise.resolve([])),
    enabled: selectedBatchId != null,
    refetchInterval: 10_000,
    staleTime: 30_000,
  })

  const selectedBatch = batches.find((b) => b.id === selectedBatchId)
  const totalYield = yields?.reduce((s, y) => s + (y.quantity ?? 0), 0) ?? 0
  const totalWaste = yields?.reduce((s, y) => s + (y.wasteQuantity ?? 0), 0) ?? 0

  const inputQty = selectedBatch?.paddyConsumed ?? selectedBatch?.plannedQuantity ?? 0
  const yieldPct = inputQty > 0 ? ((totalYield / inputQty) * 100).toFixed(1) : "—"

  const byproducts = [
    { name: "Waste / Byproducts", value: totalWaste > 0 ? `${totalWaste.toFixed(2)} (${inputQty > 0 ? ((totalWaste / inputQty) * 100).toFixed(1) : 0}%)` : "—", pct: inputQty > 0 ? Math.min((totalWaste / inputQty) * 100, 100) : 0, barClass: "bg-tertiary" },
    { name: "Moisture Loss", value: "—", pct: 0, barClass: "bg-primary" },
  ]

  return (
    <div className="bg-background text-on-surface font-body-md min-h-screen">
      <div className="min-h-screen">
        <div className="max-w-[1440px] mx-auto p-md lg:p-xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-md mb-xl">
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface">Production Yield Analysis</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">Detailed milling efficiency and output metrics for active batches.</p>
            </div>
            <div className="w-full md:w-72">
              <label className="font-label-md text-label-md text-on-surface-variant block mb-xs">Select Processing Batch</label>
              <div className="relative">
                <select
                  className="w-full bg-surface border border-outline rounded px-md py-2 appearance-none focus:ring-1 focus:ring-primary focus:border-primary outline-none text-body-md transition-all"
                  value={selectedBatchId ?? ""}
                  onChange={(e) => setSelectedBatchId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Select a batch</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.batchNo} ({b.itemName})
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2 top-2 pointer-events-none text-on-surface-variant">arrow_drop_down</span>
              </div>
            </div>
          </div>

          {!selectedBatchId ? (
            <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl mb-md">analytics</span>
              <p className="font-body-lg text-body-lg">Select a batch to view yield analysis</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-gutter">
              <div className="md:col-span-2 lg:col-span-3 bg-white border border-outline-variant p-md flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="p-xs bg-surface-container rounded">
                    <span className="material-symbols-outlined text-primary">agriculture</span>
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container-low px-2 py-0.5 rounded">TOTAL INPUT</span>
                </div>
                <div className="mt-md">
                  <p className="font-display-lg text-display-lg text-on-surface">{inputQty.toFixed(2)} <span className="text-headline-sm font-normal text-on-surface-variant">MT</span></p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Paddy Consumed / Planned</p>
                </div>
              </div>

              <div className="md:col-span-2 lg:col-span-3 bg-white border border-outline-variant p-md flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="p-xs bg-secondary-container/20 rounded">
                    <span className="material-symbols-outlined text-secondary">rice_bowl</span>
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container-low px-2 py-0.5 rounded">TOTAL YIELD</span>
                </div>
                <div className="mt-md">
                  <p className="font-display-lg text-display-lg text-secondary">{totalYield.toFixed(2)} <span className="text-headline-sm font-normal text-on-surface-variant">MT</span></p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {yields?.length ?? 0} yield record{(yields?.length ?? 0) !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <div className="md:col-span-4 lg:col-span-6 bg-white border border-outline-variant p-md lg:row-span-2 relative flex flex-col items-center justify-center">
                <div className="absolute top-md left-md">
                  <p className="font-title-md text-title-md text-on-surface">Yield Efficiency</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Actual vs Planned</p>
                </div>
                <div className="relative flex flex-col items-center justify-center mt-xl">
                  <svg className="w-48 h-48 md:w-56 md:h-56" viewBox="0 0 192 192">
                    <circle className="text-surface-container-high" cx="96" cy="96" fill="transparent" r="88" stroke="currentColor" strokeWidth="12" />
                    {yieldPct !== "—" && (
                      <circle
                        className="text-primary yield-progress-ring"
                        cx="96" cy="96" fill="transparent" r="88"
                        stroke="currentColor"
                        strokeDasharray="552.92"
                        strokeDashoffset={552.92 - (552.92 * Number(yieldPct)) / 100}
                        strokeLinecap="round" strokeWidth="12"
                      />
                    )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display-lg text-display-lg text-primary">{yieldPct}{yieldPct !== "—" ? "%" : ""}</span>
                    <span className="font-label-md text-label-md text-on-surface-variant">YIELD</span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-4 lg:col-span-6 bg-white border border-outline-variant p-md">
                <h3 className="font-title-md text-title-md text-on-surface mb-md">Yield Records</h3>
                {!yields || yields.length === 0 ? (
                  <p className="font-body-sm text-body-sm text-on-surface-variant">No yield records yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-container-high">
                          <th className="px-2 py-2 font-label-sm text-label-sm text-on-surface-variant uppercase">Qty</th>
                          <th className="px-2 py-2 font-label-sm text-label-sm text-on-surface-variant uppercase">Moisture</th>
                          <th className="px-2 py-2 font-label-sm text-label-sm text-on-surface-variant uppercase">Waste</th>
                          <th className="px-2 py-2 font-label-sm text-label-sm text-on-surface-variant uppercase">Remarks</th>
                          <th className="px-2 py-2 font-label-sm text-label-sm text-on-surface-variant uppercase">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant">
                        {yields.map((y) => (
                          <tr key={y.id} className="hover:bg-surface-container-low">
                            <td className="px-2 py-2 font-body-sm text-body-sm">{y.quantity?.toFixed(2)}</td>
                            <td className="px-2 py-2 font-body-sm text-body-sm">{y.moisturePercentage != null ? `${y.moisturePercentage}%` : "—"}</td>
                            <td className="px-2 py-2 font-body-sm text-body-sm">{y.wasteQuantity?.toFixed(2) ?? "—"}</td>
                            <td className="px-2 py-2 font-body-sm text-body-sm">{y.remarks ?? "—"}</td>
                            <td className="px-2 py-2 font-body-sm text-body-sm">{y.createdAt ? new Date(y.createdAt).toLocaleDateString() : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`
        .yield-progress-ring {
          transition: stroke-dashoffset 0.5s ease-in-out;
          transform: rotate(-90deg);
          transform-origin: 50% 50%;
        }
      `}</style>
    </div>
  )
}

