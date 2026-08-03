import type { WorkflowField, StatusConfig, KpiCardConfig } from "../types"

export const PRODUCTION_BATCH_STATS: KpiCardConfig[] = [
  { title: "Active Batches", icon: "sync", color: "primary", apiField: "activeBatches" },
  { title: "Scheduled Today", icon: "calendar_today", color: "secondary", apiField: "scheduledToday" },
  { title: "Completed (24h)", icon: "check_circle", color: "tertiary", apiField: "completed24h" },
  { title: "Efficiency Rate", icon: "analytics", color: "tertiary", apiField: "efficiencyRate", unit: "%" },
]

export const BATCH_STATUSES: StatusConfig[] = [
  { value: "IN_PROGRESS", label: "In-Progress", color: "secondary", icon: "sync" },
  { value: "PENDING", label: "Pending", color: "warning", icon: "schedule" },
  { value: "COMPLETED", label: "Completed", color: "primary", icon: "check_circle" },
  { value: "CANCELLED", label: "Cancelled", color: "error", icon: "cancel" },
]

export const PRODUCTION_OUTPUT_ITEMS: WorkflowField[] = [
  { name: "riceQty", label: "Rice", type: "number", required: true, section: "output", placeholder: "0.00" },
  { name: "brokenQty", label: "Broken", type: "number", required: true, section: "output", placeholder: "0.00" },
  { name: "branQty", label: "Bran", type: "number", required: true, section: "output", placeholder: "0.00" },
  { name: "huskQty", label: "Husk", type: "number", required: true, section: "output", placeholder: "0.00" },
]
