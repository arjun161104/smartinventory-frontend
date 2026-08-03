import type { FilterField, TableColumn, KpiCardConfig } from "../types"

export const STOCK_LEDGER_COLUMNS: TableColumn[] = [
  { key: "date", label: "Date", sortable: true },
  { key: "itemName", label: "Item" },
  { key: "referenceNo", label: "Ref No (Voucher)" },
  { key: "transactionType", label: "Type", align: "center" },
  { key: "inwardQty", label: "In Qty", align: "right", sortable: true },
  { key: "outwardQty", label: "Out Qty", align: "right" },
  { key: "balanceQty", label: "Balance", align: "right", sortable: true },
  { key: "uom", label: "UOM", align: "center" },
]

export const STOCK_LEDGER_FILTERS: FilterField[] = [
  { name: "itemId", label: "Item", type: "select", lookup: "items" },
  { name: "dateFrom", label: "From Date", type: "date" },
  { name: "dateTo", label: "To Date", type: "date" },
  { name: "godownId", label: "Godown", type: "select", lookup: "godowns" },
  { name: "transactionType", label: "Reference Type", type: "select", options: ["All", "RECEIPT", "ISSUE", "PRODUCTION_YIELD", "ADJUSTMENT"] },
]

export const STOCK_LEDGER_SUMMARY: KpiCardConfig[] = [
  { title: "Opening Balance", icon: "account_balance", color: "primary", apiField: "openingBalance", unit: "MT" },
  { title: "Total Inward (+)", icon: "arrow_downward", color: "secondary", apiField: "totalInward", unit: "MT" },
  { title: "Total Outward (-)", icon: "arrow_upward", color: "error", apiField: "totalOutward", unit: "MT" },
  { title: "Closing Balance", icon: "balance", color: "primary", apiField: "closingBalance", unit: "MT" },
]
