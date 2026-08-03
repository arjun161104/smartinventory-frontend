export type FieldType = "text" | "number" | "select" | "textarea" | "date" | "email" | "password"

export type FieldOption = string | { value: string; label: string }

export type WorkflowField = {
  name: string
  label: string
  type: FieldType
  required?: boolean
  placeholder?: string
  options?: FieldOption[]
  lookup?: string
  section?: string
  span?: "full" | "half"
}

export type TableColumn = {
  key: string
  label: string
  sortable?: boolean
  align?: "left" | "center" | "right"
}

export type FilterField = {
  name: string
  label: string
  type: "text" | "select" | "date" | "dateRange"
  options?: FieldOption[]
  lookup?: string
  field?: string
  searchFields?: string[]
}

export type KpiCardConfig = {
  title: string
  icon: string
  color?: "primary" | "secondary" | "tertiary" | "error"
  trend?: { direction: "up" | "down" | "neutral"; value: string }
  apiField?: string
  unit?: string
}

export type StatusConfig = {
  value: string
  label: string
  color: "primary" | "secondary" | "tertiary" | "error" | "warning"
  icon?: string
}
