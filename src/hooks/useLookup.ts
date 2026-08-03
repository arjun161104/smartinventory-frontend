import { useApi } from "./useApi"
import { companyApi, siteApi, warehouseApi, godownApi, itemApi, businessPartnerApi, vehicleApi, uomApi } from "../api/masterApi"

const lookupApis: Record<string, () => Promise<{ value: string; label: string }[]>> = {
  companies: () =>
    companyApi.getAll().then((rows) => rows.map((r: Record<string, unknown>) => ({ value: String(r.id), label: String(r.name ?? r.companyName ?? "") }))),

  sites: () =>
    siteApi.getAll().then((rows) => rows.map((r: Record<string, unknown>) => ({ value: String(r.id), label: String(r.name ?? r.siteName ?? "") }))),

  warehouses: () =>
    warehouseApi.getAll().then((rows) => rows.map((r: Record<string, unknown>) => ({ value: String(r.id), label: String(r.name ?? r.warehouseName ?? "") }))),

  godowns: () =>
    godownApi.getAll().then((rows) => rows.map((r: Record<string, unknown>) => ({ value: String(r.id), label: String(r.name ?? r.godownName ?? "") }))),

  items: () =>
    itemApi.getAll().then((rows) => rows.map((r: Record<string, unknown>) => ({ value: String(r.id), label: String(r.name ?? r.itemName ?? "") }))),

  "business-partners": () =>
    businessPartnerApi.getAll().then((rows) => rows.map((r: Record<string, unknown>) => ({ value: String(r.id), label: String(r.name ?? r.partnerName ?? "") }))),

  "businessPartners": () =>
    businessPartnerApi.getAll().then((rows) => rows.map((r: Record<string, unknown>) => ({ value: String(r.id), label: String(r.name ?? r.partnerName ?? "") }))),

  vehicles: () =>
    vehicleApi.getAll().then((rows) => rows.map((r: Record<string, unknown>) => ({ value: String(r.id), label: String(r.vehicleNo ?? r.regNo ?? "") }))),

  uoms: () =>
    uomApi.getAll().then((rows) => rows.map((r: Record<string, unknown>) => ({ value: String(r.id), label: String(r.name ?? r.uom ?? r.code ?? "") }))),
}

export function useLookup(lookupName: string | undefined) {
  const apiFn = lookupName ? lookupApis[lookupName] : undefined

  const { data, loading, error } = useApi(
    async () => {
      if (!apiFn) return []
      return apiFn()
    },
    [lookupName],
  )

  return {
    options: data ?? [],
    loading,
    error,
  }
}

export function useLookups(lookupNames: string[]) {
  const results = lookupNames.map((name) => ({
    name,
    ...useLookup(name),
  }))

  const combined: Record<string, { value: string; label: string }[]> = {}
  for (const r of results) {
    combined[r.name] = r.options
  }

  const loading = results.some((r) => r.loading)

  return { lookups: combined, loading }
}
