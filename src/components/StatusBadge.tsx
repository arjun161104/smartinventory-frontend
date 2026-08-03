import type { StatusConfig } from "../types"

type Props = {
  value: string
  statuses: StatusConfig[]
}

const colorClasses: Record<string, string> = {
  primary: "bg-primary/10 text-primary border-primary/20",
  secondary: "bg-secondary-container text-on-secondary-container",
  tertiary: "bg-tertiary-fixed text-on-tertiary-fixed-variant border-tertiary/20",
  error: "bg-error-container text-on-error-container border-error/20",
  warning: "bg-amber-50 text-amber-800 border-amber-200",
}

export default function StatusBadge({ value, statuses }: Props) {
  const match = statuses.find((s) => s.value === value)
  if (!match) {
    return (
      <span className="px-2 py-1 rounded text-label-sm font-bold border bg-surface-container-high text-on-surface-variant border-outline-variant">
        {value}
      </span>
    )
  }

  return (
    <span className={`px-2 py-1 rounded text-label-sm font-bold border flex items-center gap-1 w-fit ${colorClasses[match.color] ?? colorClasses.warning}`}>
      {match.icon && <span className="material-symbols-outlined text-[14px]">{match.icon}</span>}
      {match.label}
    </span>
  )
}
