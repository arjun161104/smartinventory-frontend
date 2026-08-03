import type { WorkflowField, StatusConfig } from "../types"

export const QC_PARAMETER_FIELDS: WorkflowField[] = [
  { name: "moisture", label: "Moisture", type: "number", required: true, placeholder: "0.0" },
  { name: "broken", label: "Broken", type: "number", required: true, placeholder: "0.0" },
  { name: "damaged", label: "Damaged", type: "number", required: true, placeholder: "0.0" },
  { name: "foreignMatter", label: "Foreign Matter", type: "number", required: true, placeholder: "0.0" },
  { name: "grade", label: "Grade", type: "select", required: true, options: ["A", "B", "C", "Rejected"] },
  { name: "remarks", label: "Remarks", type: "textarea", span: "full" },
]

export const QC_STATUSES: StatusConfig[] = [
  { value: "APPROVED", label: "Approved", color: "primary", icon: "check_circle" },
  { value: "REJECTED", label: "Rejected", color: "error", icon: "cancel" },
  { value: "PENDING", label: "Pending", color: "warning", icon: "schedule" },
]
