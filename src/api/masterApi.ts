import { createResource } from "./resource"

export type MasterRecord = Record<string, unknown>

export const companyApi = createResource<MasterRecord>("/companies")
export const siteApi = createResource<MasterRecord>("/sites")
export const warehouseApi = createResource<MasterRecord>("/warehouses")
export const godownApi = createResource<MasterRecord>("/godowns")
export const uomApi = createResource<MasterRecord>("/uoms")
export const itemApi = createResource<MasterRecord>("/items")
export const businessPartnerApi = createResource<MasterRecord>("/business-partners")
export const vehicleApi = createResource<MasterRecord>("/vehicles")
export const userApi = createResource<MasterRecord>("/users")

export const masterApis: Record<string, ReturnType<typeof createResource<MasterRecord>>> = {
  companies: companyApi,
  sites: siteApi,
  warehouses: warehouseApi,
  uoms: uomApi,
  items: itemApi,
  "business-partners": businessPartnerApi,
  vehicles: vehicleApi,
  users: userApi,
}
