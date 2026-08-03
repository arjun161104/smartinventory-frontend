import type { WorkflowField, TableColumn, FilterField, StatusConfig } from "../types"

export const INWARD_GROSS_FIELDS: WorkflowField[] = [
  { name: "vendorId", label: "Vendor", type: "select", required: true, lookup: "businessPartners", section: "logistics" },
  { name: "itemId", label: "Item", type: "select", required: true, lookup: "items", section: "logistics" },
  { name: "vehicleId", label: "Vehicle Number", type: "select", required: true, lookup: "vehicles", section: "logistics" },
  { name: "siteId", label: "Site", type: "select", required: true, lookup: "sites", section: "location" },
  { name: "warehouseId", label: "Warehouse", type: "select", required: true, lookup: "warehouses", section: "location" },
  { name: "bagCount", label: "Bag Count", type: "number", required: true, section: "measurement" },
  { name: "grossWeight", label: "Gross Weight (kg)", type: "number", required: true, section: "measurement" },
]

export const INWARD_TARE_FIELDS: WorkflowField[] = [
  { name: "tareWeight", label: "Tare Weight (kg)", type: "number", required: true },
]

export const INWARD_HISTORY_COLUMNS: TableColumn[] = [
  { key: "voucherNo", label: "Voucher" },
  { key: "vendorName", label: "Vendor" },
  { key: "vehicleNumber", label: "Vehicle" },
  { key: "grossWeight", label: "Gross", align: "right" },
  { key: "tareWeight", label: "Tare", align: "right" },
  { key: "netWeight", label: "Net", align: "right" },
]

export const INWARD_STATUSES: StatusConfig[] = [
  { value: "PENDING", label: "Pending", color: "warning", icon: "pending" },
  { value: "QC_PENDING", label: "QC Pending", color: "tertiary", icon: "science" },
  { value: "COMPLETED", label: "Completed", color: "secondary", icon: "check_circle" },
]

export const INWARD_HISTORY_FILTERS: FilterField[] = [
  { name: "search", label: "Search Voucher or Vehicle", type: "text", searchFields: ["voucherNo", "vehicleNumber", "vendorName"] },
  { name: "dateFrom", label: "From Date", type: "date", field: "grossWeightTime" },
  { name: "dateTo", label: "To Date", type: "date", field: "grossWeightTime" },
  { name: "warehouseId", label: "Warehouse", type: "select", lookup: "warehouses" },
]
