import type { KpiCardConfig, TableColumn } from "../types"

export const DASHBOARD_KPI_CARDS: KpiCardConfig[] = [
  { title: "Today's Paddy", icon: "agriculture", color: "primary", apiField: "todayPaddy", unit: "MT" },
  { title: "Today's Production", icon: "precision_manufacturing", color: "secondary", apiField: "todayProduction", unit: "MT" },
  { title: "Rice Yield %", icon: "analytics", color: "tertiary", apiField: "riceYield", unit: "%" },
  { title: "Paddy Stock", icon: "inventory_2", color: "primary", apiField: "paddyStock", unit: "KG" },
  { title: "Bags", icon: "inventory", color: "secondary", apiField: "bags", unit: "BAGS" },
  { title: "Husk Stock", icon: "cycling", color: "tertiary", apiField: "huskStock", unit: "MT" },
  { title: "Receivables", icon: "payments", color: "error", apiField: "receivables", unit: "LAKH" },
  { title: "Payables", icon: "account_balance", color: "error", apiField: "payables", unit: "LAKH" },
]

export const DASHBOARD_RECENT_WEIGHMENTS = {
  columns: [
    { key: "voucherNo", label: "Voucher No" },
    { key: "grossWeight", label: "Gross Wt.", align: "right" as const },
  ] satisfies TableColumn[],
  apiEndpoint: "/api/dashboard/recent-weighments",
}

export const DASHBOARD_PENDING_QC = {
  title: "Pending Quality Checks",
  apiEndpoint: "/api/dashboard/pending-qc",
}
