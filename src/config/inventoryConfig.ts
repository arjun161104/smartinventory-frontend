import type { KpiCardConfig, TableColumn } from "../types"

export const INVENTORY_KPI_CARDS: KpiCardConfig[] = [
  { title: "Total Stock Value", icon: "payments", color: "primary", apiField: "totalStockValue", unit: "$" },
  { title: "Low Stock Alerts", icon: "warning", color: "tertiary", apiField: "lowStockAlerts" },
  { title: "Out of Stock", icon: "inventory_2", color: "error", apiField: "outOfStock" },
]

export const INVENTORY_CATEGORIES: { name: string; apiField: string; barClass: string }[] = [
  { name: "Paddy", apiField: "paddy", barClass: "bg-primary" },
  { name: "Rice", apiField: "rice", barClass: "bg-secondary" },
  { name: "Husk", apiField: "husk", barClass: "bg-tertiary-container" },
  { name: "Bags", apiField: "packaging", barClass: "bg-outline" },
]

export const INVENTORY_MOVEMENT_COLUMNS: TableColumn[] = [
  { key: "timestamp", label: "Timestamp" },
  { key: "itemCode", label: "Item ID" },
  { key: "itemName", label: "Item Name" },
  { key: "quantity", label: "Quantity", align: "right" },
  { key: "warehouse", label: "Warehouse" },
  { key: "status", label: "Status", align: "center" },
]
