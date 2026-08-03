import type { FilterField } from "../types"

export const OUTWARD_HISTORY_FILTERS: FilterField[] = [
  { name: "search", label: "Search Dispatch or Vehicle", type: "text", searchFields: ["dispatchNo", "vehicleNumber", "customerName"] },
  { name: "dateFrom", label: "From Date", type: "date", field: "dispatchDate" },
  { name: "dateTo", label: "To Date", type: "date", field: "dispatchDate" },
  { name: "warehouseId", label: "Warehouse", type: "select", lookup: "warehouses" },
  { name: "customerId", label: "Customer", type: "select", lookup: "businessPartners" },
]
