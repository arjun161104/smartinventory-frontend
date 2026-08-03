export type MasterType =
  | "COMPANY"
  | "SITE"
  | "WAREHOUSE"
  | "UOM"
  | "ITEM"
  | "BUSINESS_PARTNER"
  | "VEHICLE"
  | "USER"

export type FieldConfig = {
  name: string
  label: string
  type: "text" | "number" | "email" | "password" | "textarea" | "select"
  required?: boolean
  placeholder?: string
  options?: string[]
  lookup?: string
  defaultValue?: string
}

export type ColumnConfig = {
  key: string
  label: string
}

export type MasterConfig = {
  title: string
  endpoint: string
  fields: FieldConfig[]
  columns: ColumnConfig[]
  tableKey: string
}

export const MASTER_CONFIG: Record<MasterType, MasterConfig> = {
  COMPANY: {
    title: "Company",
    endpoint: "/api/companies",
    tableKey: "companyName",
    fields: [
      { name: "companyName", label: "Company Name", type: "text", required: true, placeholder: "e.g. Green Valley Farms Pvt. Ltd." },
      { name: "gstNumber", label: "GST Number", type: "text", placeholder: "e.g. 27AABCU9603R1ZX" },
      { name: "phone", label: "Phone", type: "text", placeholder: "e.g. +91-9876543210" },
      { name: "email", label: "Email", type: "email", required: true, placeholder: "e.g. contact@company.com" },
      { name: "address", label: "Address", type: "textarea", placeholder: "Enter full address..." },
    ],
    columns: [
      { key: "companyName", label: "Company Name" },
      { key: "gstNumber", label: "GST" },
      { key: "phone", label: "Phone" },
    ],
  },
  SITE: {
    title: "Site",
    endpoint: "/api/sites",
    tableKey: "siteCode",
    fields: [
      { name: "siteCode", label: "Site Code", type: "text", required: true, placeholder: "e.g. SITE-001" },
      { name: "siteName", label: "Site Name", type: "text", required: true, placeholder: "e.g. Main Processing Unit" },
      { name: "location", label: "Location", type: "text", required: true, placeholder: "e.g. Industrial Area, Phase 2" },
      { name: "address", label: "Address", type: "textarea", placeholder: "Enter full address..." },
      { name: "companyId", label: "Company", type: "select", lookup: "companies", required: true },
    ],
    columns: [
      { key: "siteCode", label: "Site Code" },
      { key: "siteName", label: "Site Name" },
      { key: "location", label: "Location" },
    ],
  },
  WAREHOUSE: {
    title: "Warehouse",
    endpoint: "/api/warehouses",
    tableKey: "warehouseCode",
    fields: [
      { name: "warehouseCode", label: "Warehouse Code", type: "text", required: true, placeholder: "e.g. WH-001" },
      { name: "warehouseName", label: "Warehouse Name", type: "text", required: true, placeholder: "e.g. Main Storage A" },
      { name: "siteId", label: "Site", type: "select", lookup: "sites", required: true },
    ],
    columns: [
      { key: "warehouseCode", label: "Warehouse Code" },
      { key: "warehouseName", label: "Warehouse Name" },
    ],
  },
  UOM: {
    title: "UOM",
    endpoint: "/api/uoms",
    tableKey: "uomCode",
    fields: [
      { name: "uomCode", label: "UOM Code", type: "text", required: true, placeholder: "e.g. KG" },
      { name: "uomName", label: "UOM Name", type: "text", required: true, placeholder: "e.g. Kilograms" },
      { name: "baseUomId", label: "Base Unit", type: "select", lookup: "uoms", placeholder: "Select base unit (optional)" },
      { name: "conversionFactor", label: "Conversion Factor", type: "number", placeholder: "e.g. 1000 (1 base = ? of this unit)" },
    ],
    columns: [
      { key: "uomCode", label: "UOM Code" },
      { key: "uomName", label: "UOM Name" },
      { key: "baseUomName", label: "Base Unit" },
      { key: "conversionFactor", label: "Conversion Factor" },
    ],
  },
  ITEM: {
    title: "Item",
    endpoint: "/api/items",
    tableKey: "itemCode",
    fields: [
      { name: "itemCode", label: "Item Code", type: "text", required: true, placeholder: "e.g. RICE-001" },
      { name: "itemName", label: "Item Name", type: "text", required: true, placeholder: "e.g. Premium Basmati Rice" },
      { name: "itemType", label: "Item Type", type: "select", required: true, options: ["RAW_MATERIAL", "FINISHED_GOOD", "BYPRODUCT", "CONSUMABLE"] },
      { name: "uomId", label: "UOM", type: "select", lookup: "uoms", required: true },
      { name: "outturnPercent", label: "Outturn %", type: "number", placeholder: "e.g. 67" },
    ],
    columns: [
      { key: "itemCode", label: "Code/ID" },
      { key: "itemName", label: "Name" },
      { key: "itemType", label: "Type" },
      { key: "outturnPercent", label: "Outturn %" },
    ],
  },
  BUSINESS_PARTNER: {
    title: "Business Partner",
    endpoint: "/api/business-partners",
    tableKey: "name",
    fields: [
      { name: "name", label: "Name", type: "text", required: true, placeholder: "e.g. ABC Traders" },
      { name: "partnerType", label: "Partner Type", type: "select", required: true, options: ["Vendor", "Customer", "Both"] },
      { name: "gstNumber", label: "GST Number", type: "text", placeholder: "e.g. 27AABCU9603R1ZX" },
      { name: "contactPerson", label: "Contact Person", type: "text", placeholder: "e.g. Rajesh Kumar" },
      { name: "mobileNumber", label: "Mobile Number", type: "text", required: true, placeholder: "e.g. +91-9876543210" },
      { name: "email", label: "Email", type: "email", placeholder: "e.g. contact@partner.com" },
      { name: "address", label: "Address", type: "textarea", placeholder: "Enter full address..." },
      { name: "balanceBagsDue", label: "Balance Bags Due", type: "number", placeholder: "e.g. 1900" },
    ],
    columns: [
      { key: "name", label: "Name" },
      { key: "partnerType", label: "Partner Type" },
      { key: "mobileNumber", label: "Mobile" },
    ],
  },
  VEHICLE: {
    title: "Vehicle",
    endpoint: "/api/vehicles",
    tableKey: "vehicleNumber",
    fields: [
      { name: "vehicleNumber", label: "Vehicle Number", type: "text", required: true, placeholder: "e.g. MH-12-AB-1234" },
      { name: "vehicleType", label: "Vehicle Type", type: "select", required: true, options: ["A", "C", "Other"] },
      { name: "driverName", label: "Driver Name", type: "text", required: true, placeholder: "e.g. Suresh Singh" },
      { name: "mobileNumber", label: "Mobile Number", type: "text", required: true, placeholder: "e.g. +91-9876543210" },
      { name: "fuelType", label: "Fuel Type", type: "select", options: ["Diesel", "Petrol", "Electric", "CNG"] },
    ],
    columns: [
      { key: "vehicleNumber", label: "Vehicle Number" },
      { key: "driverName", label: "Driver" },
      { key: "fuelType", label: "Fuel Type" },
    ],
  },
  USER: {
    title: "User Management",
    endpoint: "/api/users",
    tableKey: "username",
    fields: [
      { name: "username", label: "Username", type: "text", required: true, placeholder: "e.g. johndoe" },
      { name: "fullName", label: "Full Name", type: "text", required: true, placeholder: "e.g. John Doe" },
      { name: "email", label: "Email", type: "email", required: true, placeholder: "e.g. john@company.com" },
      { name: "role", label: "Role", type: "select", required: true, options: ["ROLE_ADMIN", "ROLE_WEIGHBRIDGE", "ROLE_QC", "ROLE_STORE", "ROLE_PRODUCTION", "ROLE_ACCOUNTS", "ROLE_SALES"] },
      { name: "password", label: "Password", type: "password", required: true, placeholder: "Enter password" },
    ],
    columns: [
      { key: "username", label: "Username" },
      { key: "fullName", label: "Full Name" },
      { key: "email", label: "Email" },
      { key: "role", label: "Role" },
    ],
  },
}
