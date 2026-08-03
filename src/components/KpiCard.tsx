import type { KpiCardConfig } from "../types"

type Props = {
  config: KpiCardConfig
  value?: string | number
  onClick?: () => void
}

const colorMap: Record<string, { bgIcon: string; iconColor: string; trendUp: string; trendDown: string }> = {
  primary: { bgIcon: "bg-primary-container", iconColor: "text-primary", trendUp: "text-[#065f46] bg-[#dcfce7]", trendDown: "text-[#991b1b] bg-[#fee2e2]" },
  secondary: { bgIcon: "bg-secondary-container/20", iconColor: "text-secondary", trendUp: "text-secondary bg-secondary-fixed", trendDown: "text-[#991b1b] bg-[#fee2e2]" },
  tertiary: { bgIcon: "bg-tertiary-container", iconColor: "text-tertiary", trendUp: "text-tertiary bg-tertiary-fixed", trendDown: "text-[#991b1b] bg-[#fee2e2]" },
  error: { bgIcon: "bg-error-container", iconColor: "text-error", trendUp: "text-[#065f46] bg-[#dcfce7]", trendDown: "text-[#991b1b] bg-[#fee2e2]" },
}

export default function KpiCard({ config, value, onClick }: Props) {
  const colors = colorMap[config.color ?? "primary"]
  const displayValue = value ?? config.apiField ?? "—"
  const trend = config.trend

  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-surface-container-lowest border border-outline-variant p-4 flex flex-col gap-1 text-left w-full cursor-pointer active:opacity-80 transition-all"
    >
      <span className="font-label-sm text-label-sm text-on-surface-variant">{config.title}</span>
      <div className="flex items-baseline gap-1">
        <span className="font-headline-sm text-headline-sm font-bold">{displayValue}</span>
        {config.unit && <span className="font-label-sm text-label-sm text-outline">{config.unit}</span>}
      </div>
      {trend && (
        <div className={`flex items-center w-fit px-1 rounded ${trend.direction === "up" ? colors.trendUp : trend.direction === "down" ? colors.trendDown : "text-primary bg-primary-fixed"}`}>
          <span className="material-symbols-outlined text-[12px]">
            {trend.direction === "up" ? "trending_up" : trend.direction === "down" ? "trending_down" : "check_circle"}
          </span>
          <span className="font-label-sm text-label-sm">{trend.value}</span>
        </div>
      )}
    </button>
  )
}
