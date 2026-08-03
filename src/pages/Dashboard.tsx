import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import BottomNav from "../components/BottomNav"
import KpiCard from "../components/KpiCard"
import BagDetailsModal from "../components/BagDetailsModal"
import { DASHBOARD_KPI_CARDS } from "../config/dashboardConfig"
import { getAllInwards, getInwardStats } from "../api/inwardApi"
import { getInventorySummary } from "../api/inventoryApi"
import { getProductionStats } from "../api/productionApi"
import type { KpiCardConfig } from "../types"

function computeTrend(current: number, previous: number): { direction: "up" | "down" | "neutral"; value: string } {
  if (previous === 0 && current === 0) return { direction: "neutral", value: "No data" }
  if (previous === 0) return { direction: "up", value: "New" }
  const pct = ((current - previous) / previous) * 100
  return {
    direction: pct >= 0 ? "up" : "down",
    value: `${Math.abs(pct).toFixed(1)}%`,
  }
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [showBagModal, setShowBagModal] = useState(false)

  const { data: weighments = [] } = useQuery({
    queryKey: ["inwards", "dashboard"],
    queryFn: () => getAllInwards(),
    refetchInterval: 10_000,
    staleTime: 30_000,
  })

  const { data: inwardStats } = useQuery({
    queryKey: ["inward", "stats"],
    queryFn: () => getInwardStats(),
    refetchInterval: 10_000,
    staleTime: 30_000,
  })

  const { data: inventorySummary } = useQuery({
    queryKey: ["inventory", "summary"],
    queryFn: () => getInventorySummary(),
    refetchInterval: 10_000,
    staleTime: 30_000,
  })

  const { data: productionStats } = useQuery({
    queryKey: ["production", "stats"],
    queryFn: () => getProductionStats(),
    refetchInterval: 10_000,
    staleTime: 30_000,
  })

  const todayStr = new Date().toDateString()
  const todayWeighments = weighments.filter((w) => {
    const wDate = new Date(w.createdAt)
    return wDate.toDateString() === todayStr
  })

  const totalGrossToday = todayWeighments.reduce((sum, w) => sum + (w.grossWeight || 0), 0)

  const inv = (inventorySummary ?? {}) as Record<string, unknown>
  const prod = productionStats as Record<string, number> | undefined
  const stats = (inwardStats ?? {}) as Record<string, unknown>

  const yesterdayGrossWeight = (stats.yesterdayGrossWeight as number) ?? 0
  const yesterdayCount = (stats.yesterdayCount as number) ?? 0
  const todayGrossWeight = (stats.todayGrossWeight as number) ?? 0
  const todayCount = (stats.todayCount as number) ?? 0

  const paddyTrend = computeTrend(todayGrossWeight, yesterdayGrossWeight)

  const todayProductionValue = Math.round(totalGrossToday * 0.68)
  const yesterdayProduction = Math.round(yesterdayGrossWeight * 0.68)
  const productionTrend = computeTrend(todayProductionValue, yesterdayProduction)

  const prodTotalYield = prod?.totalYield ?? 0
  const prodActiveBatches = prod?.activeBatches ?? 0
  const prodCompletedBatches = prod?.completedBatches ?? 0

  const riceYieldValue = prodTotalYield > 0 && totalGrossToday > 0
    ? ((prodTotalYield / totalGrossToday) * 100).toFixed(1)
    : "68.4"

  const rawMaterialStock = (inv.RAW_MATERIAL_stock as number) ?? 0
  const finishedGoodStock = (inv.FINISHED_GOOD_stock as number) ?? 0
  const byproductStock = (inv.BYPRODUCT_stock as number) ?? 0

  const totalBagCount = weighments.reduce((sum, w) => sum + (w.bagCount || 0), 0)
  const totalPaddyReceived = weighments.reduce((sum, w) => sum + (w.netWeight || w.grossWeight || 0), 0)

  function fmt(v: number): string {
    return Math.round(v).toLocaleString("en-IN")
  }

  const availablePaddy = rawMaterialStock > 0 ? rawMaterialStock : totalPaddyReceived

  const kpiValues: Record<string, string | number> = {
    todayPaddy: totalGrossToday.toFixed(2),
    todayProduction: todayProductionValue,
    riceYield: riceYieldValue,
    paddyStock: availablePaddy > 0 ? fmt(availablePaddy) : "—",
    bags: totalBagCount > 0 ? fmt(totalBagCount) : "—",
    huskStock: byproductStock > 0 ? byproductStock : "—",
    receivables: "12.4",
    payables: "8.1",
  }

  const trendOverrides: Record<string, { direction: "up" | "down" | "neutral"; value: string }> = {
    todayPaddy: paddyTrend,
    todayProduction: productionTrend,
    riceYield: { direction: "neutral", value: `${prodCompletedBatches} batches` },
    paddyStock: { direction: "neutral", value: `${fmt(availablePaddy)} KG` },
    huskStock: { direction: "neutral", value: `${byproductStock} MT` },
  }

  const kpiCardsWithTrends: KpiCardConfig[] = DASHBOARD_KPI_CARDS.map((card) => {
    const override = card.apiField ? trendOverrides[card.apiField] : undefined
    return override ? { ...card, trend: override } : card
  })

  const recentWeighments = [...weighments].slice(-4).reverse()

  return (
    <div className="flex flex-col gap-6 px-4 py-6 pb-24">
      <section className="flex flex-col gap-1">
        <h2 className="font-headline-sm text-headline-sm text-primary">Operations Dashboard</h2>
        <div className="flex items-center gap-1 text-on-surface-variant font-label-md text-label-md">
          <span className="material-symbols-outlined text-[16px]">calendar_today</span>
          <span>{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} | Day Shift</span>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4">
        {kpiCardsWithTrends.map((card) => (
          <KpiCard
            key={card.title}
            config={card}
            value={kpiValues[card.apiField ?? ""] ?? "N/A"}
            onClick={card.apiField === "bags" ? () => setShowBagModal(true) : undefined}
          />
        ))}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex justify-between items-end">
          <h3 className="font-title-md text-title-md text-primary">Recent Weighments</h3>
          <button
            onClick={() => navigate("/operations/inward-history")}
            className="font-label-md text-label-md text-primary hover:underline cursor-pointer"
          >
            View All
          </button>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-surface-container text-on-surface-variant font-label-sm text-label-sm uppercase">
              <tr>
                <th className="px-4 py-2">Voucher No</th>
                <th className="px-4 py-2 text-right">Gross Wt.</th>
              </tr>
            </thead>
            <tbody className="font-body-md text-body-md divide-y divide-outline-variant">
              {recentWeighments.length > 0 ? recentWeighments.map((row) => (
                <tr key={row.id} className="hover:bg-surface-container-low transition-colors h-12">
                  <td className="px-4">{row.voucherNo}</td>
                  <td className="px-4 text-right font-bold">{row.grossWeight?.toFixed(2) ?? "0.00"} MT</td>
                </tr>
              )) : (
                <tr className="h-12">
                  <td className="px-4 text-on-surface-variant" colSpan={2}>No recent weighments</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <BottomNav />

      {showBagModal && (
        <BagDetailsModal weighments={weighments} onClose={() => setShowBagModal(false)} />
      )}
    </div>
  )
}

