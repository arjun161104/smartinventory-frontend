import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { getAllBatches, getProductionStats } from "../../api/productionApi"
import KpiCard from "../../components/KpiCard"
import StatusBadge from "../../components/StatusBadge"
import { PRODUCTION_BATCH_STATS, BATCH_STATUSES } from "../../config/productionConfig"

type TabValue = "IN_PROGRESS" | "COMPLETED" | "PLANNED"

export default function ProductionBatch() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabValue>("IN_PROGRESS")

  const { data: stats } = useQuery({
    queryKey: ["production-stats"],
    queryFn: () => getProductionStats(),
    refetchInterval: 10_000,
    staleTime: 30_000,
  })

  const { data: batchesPage, isLoading } = useQuery({
    queryKey: ["production-batches", activeTab],
    queryFn: () => getAllBatches({ status: activeTab, page: 0, size: 50 }),
    refetchInterval: 10_000,
    staleTime: 30_000,
  })

  const batches = batchesPage?.content ?? []

  const statValues: Record<string, string | number> = {
    activeBatches: stats?.activeBatches ?? "—",
    scheduledToday: "—",
    completed24h: stats?.completedBatches ?? "—",
    efficiencyRate: stats?.totalYield ? ((stats.totalYield / (stats.totalBatches || 1)) * 10).toFixed(1) : "—",
  }

  const tabs: { label: string; value: TabValue }[] = [
    { label: `Active Batches`, value: "IN_PROGRESS" },
    { label: "Completed", value: "COMPLETED" },
    { label: "Planned", value: "PLANNED" },
  ]

  const formatDate = (d: string | null | undefined) => {
    if (!d) return "—"
    return new Date(d).toLocaleString("en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    })
  }

  const progressPct = (batch: { producedQuantity?: number | null; plannedQuantity?: number | null }) => {
    if (!batch.plannedQuantity || !batch.producedQuantity) return 0
    return Math.min(Math.round((batch.producedQuantity / batch.plannedQuantity) * 100), 100)
  }

  return (
    <div className="bg-background text-on-background min-h-screen">
      <div className="min-h-screen">
        <div className="p-container-margin">
          <div className="flex justify-between items-end mb-lg">
            <div>
              <h2 className="font-display-lg text-display-lg text-on-surface">Production Batches</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">Manage and monitor real-time milling operations.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-md mb-xl">
            {PRODUCTION_BATCH_STATS.map((card) => (
              <KpiCard key={card.title} config={card} value={statValues[card.apiField ?? ""] ?? card.apiField} />
            ))}
          </div>

          <div className="flex border-b border-outline-variant mb-md overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-lg py-md whitespace-nowrap font-label-md text-label-md ${
                  activeTab === tab.value
                    ? "border-b-2 border-primary text-primary"
                    : "text-on-surface-variant hover:bg-surface-container transition-colors"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <span className="material-symbols-outlined text-4xl text-outline-variant animate-spin">progress_activity</span>
            </div>
          ) : batches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl mb-md">precision_manufacturing</span>
              <p className="font-body-lg text-body-lg">No batches found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
              {batches.map((batch: any) => {
                const pct = progressPct(batch)
                return (
                  <div
                    key={batch.id}
                    className="bg-white border border-outline-variant rounded-xl p-md shadow-sm hover:border-primary transition-colors flex flex-col"
                  >
                    <div className="flex justify-between items-start mb-md">
                      <div>
                        <h4 className="font-title-md text-title-md text-on-surface">{batch.batchNo}</h4>
                        <p className="font-body-md text-body-md text-on-surface-variant">{batch.itemName}</p>
                      </div>
                      <StatusBadge value={batch.status} statuses={BATCH_STATUSES} />
                    </div>

                    {batch.plannedQuantity && (
                      <div className="mb-md">
                        <div className="flex justify-between mb-xs">
                          <span className="font-label-sm text-label-sm text-on-surface-variant">Progress</span>
                          <span className="font-label-sm text-label-sm text-on-surface font-bold">{pct}%</span>
                        </div>
                        <div className="w-full bg-surface-container-high rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-md border-t border-outline-variant pt-md mt-auto">
                      <div>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">Planned Qty</p>
                        <p className="font-body-md text-body-md text-on-surface">{batch.plannedQuantity ?? "—"}</p>
                      </div>
                      <div>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">Produced</p>
                        <p className="font-body-md text-body-md text-on-surface">{batch.producedQuantity ?? "—"}</p>
                      </div>
                      <div>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">Start</p>
                        <p className="font-body-md text-body-md text-on-surface">{formatDate(batch.startDate)}</p>
                      </div>
                      <div>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">End</p>
                        <p className="font-body-md text-body-md text-on-surface">{formatDate(batch.endDate)}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

