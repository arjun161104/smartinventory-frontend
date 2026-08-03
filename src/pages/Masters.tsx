import { useState, useEffect, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { MASTER_CONFIG } from "../config/masterConfig"
import type { MasterType, FieldConfig } from "../config/masterConfig"
import { masterApis, companyApi, siteApi, warehouseApi, uomApi, itemApi, businessPartnerApi, vehicleApi } from "../api/masterApi"
import type { MasterRecord } from "../api/masterApi"
import DynamicField from "../components/master/DynamicField"
import DynamicTable from "../components/master/DynamicTable"

const masterTypes = Object.keys(MASTER_CONFIG) as MasterType[]

const MASTER_TYPE_TO_API_KEY: Record<MasterType, string> = {
  COMPANY: "companies",
  SITE: "sites",
  WAREHOUSE: "warehouses",
  UOM: "uoms",
  ITEM: "items",
  BUSINESS_PARTNER: "business-partners",
  VEHICLE: "vehicles",
  USER: "users",
}

const LOOKUP_FETCHERS: Record<string, () => Promise<{ value: string; label: string }[]>> = {
  companies: () =>
    companyApi.getAll().then((rows) =>
      rows.map((r) => ({ value: String(r.id), label: String(r.companyName ?? r.name ?? "") })),
    ),
  sites: () =>
    siteApi.getAll().then((rows) =>
      rows.map((r) => ({ value: String(r.id), label: String(r.siteName ?? r.name ?? "") })),
    ),
  warehouses: () =>
    warehouseApi.getAll().then((rows) =>
      rows.map((r) => ({ value: String(r.id), label: String(r.warehouseName ?? r.name ?? "") })),
    ),
  uoms: () =>
    uomApi.getAll().then((rows) =>
      rows.map((r) => ({ value: String(r.id), label: String(r.uomName ?? r.name ?? r.code ?? "") })),
    ),
  items: () =>
    itemApi.getAll().then((rows) =>
      rows.map((r) => ({ value: String(r.id), label: String(r.itemName ?? r.name ?? "") })),
    ),
  "business-partners": () =>
    businessPartnerApi.getAll().then((rows) =>
      rows.map((r) => ({ value: String(r.id), label: String(r.name ?? r.partnerName ?? "") })),
    ),
  vehicles: () =>
    vehicleApi.getAll().then((rows) =>
      rows.map((r) => ({ value: String(r.id), label: String(r.vehicleNumber ?? r.regNo ?? "") })),
    ),
}

function StatusToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="space-y-base flex items-center gap-3 pt-2">
      <span className="font-label-md text-on-surface-variant">Status</span>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" className="sr-only peer" checked={value} onChange={(e) => onChange(e.target.checked)} />
        <div className="w-9 h-5 bg-surface-container-highest rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
        <span className="ml-2 text-label-md text-on-surface">Active</span>
      </label>
    </div>
  )
}

function lookupLabel(configTitle: string): string {
  if (configTitle === "User Management") return "Users"
  if (configTitle === "Business Partner") return "Partners"
  return configTitle + "s"
}

export default function Masters() {
  const queryClient = useQueryClient()
  const [selectedMaster, setSelectedMaster] = useState<MasterType>("ITEM")
  const [formData, setFormData] = useState<Record<string, unknown>>({ active: true })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [search, setSearch] = useState("")
  const [lookups, setLookups] = useState<Record<string, { value: string; label: string }[]>>({})
  const [error, setError] = useState<string | null>(null)
  const [blinkingFields, setBlinkingFields] = useState<Set<string>>(new Set())
  const [blinkVersion, setBlinkVersion] = useState(0)

  const config = MASTER_CONFIG[selectedMaster]
  const apiKey = MASTER_TYPE_TO_API_KEY[selectedMaster]
  const api = masterApis[apiKey]

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["masters", apiKey],
    queryFn: () => api.getAll(),
  })

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["masters", apiKey] })
      resetForm()
      setEditingId(null)
    },
    onError: (err: Error) => setError(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) => api.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["masters", apiKey] })
      resetForm()
      setEditingId(null)
    },
    onError: (err: Error) => setError(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["masters", apiKey] })
    },
    onError: (err: Error) => setError(err.message),
  })

  const resetForm = () => {
    const defaults: Record<string, unknown> = { active: true }
    config.fields.forEach((f) => {
      if (f.defaultValue) defaults[f.name] = f.defaultValue
    })
    setFormData(defaults)
  }

  useEffect(() => {
    resetForm()
    setEditingId(null)
    setSearch("")
    setError(null)
    setBlinkingFields(new Set())
  }, [selectedMaster])

  useEffect(() => {
    const lookupNames = [
      ...new Set(config.fields.filter((f): f is FieldConfig & { lookup: string } => !!f.lookup).map((f) => f.lookup)),
    ]
    if (lookupNames.length === 0) {
      setLookups({})
      return
    }
    let cancelled = false
    Promise.all(
      lookupNames.map(async (name) => {
        const fetcher = LOOKUP_FETCHERS[name]
        const options = fetcher ? await fetcher() : []
        return [name, options] as const
      }),
    ).then((results) => {
      if (!cancelled) setLookups(Object.fromEntries(results))
    }).catch(() => {
      if (!cancelled) setLookups({})
    })
    return () => { cancelled = true }
  }, [config.fields, selectedMaster])

  const mappedRecords = useMemo(() => {
    if (apiKey !== "business-partners") return records
    return records.map((r) => {
      const isV = !!r.isVendor
      const isC = !!r.isCustomer
      return { ...r, partnerType: isV && isC ? "Both" : isV ? "Vendor" : isC ? "Customer" : "", mobileNumber: r.phone }
    })
  }, [records, apiKey])

  const filteredRecords = useMemo(() => {
    const source = apiKey === "business-partners" ? mappedRecords : records
    if (!search) return source
    const q = search.toLowerCase()
    return source.filter((r) =>
      config.columns.some((col) => String(r[col.key] ?? "").toLowerCase().includes(q)),
    )
  }, [records, mappedRecords, search, config.columns, apiKey])

  const handleChange = (name: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (blinkingFields.has(name)) {
      setBlinkingFields((prev) => { const next = new Set(prev); next.delete(name); return next })
    }
  }

  const buildPayload = (): { payload: Record<string, unknown> } | { error: string } => {
    const payload: Record<string, unknown> = {}

    for (const field of config.fields) {
      let value = formData[field.name]
      if ((value === undefined || value === null || value === "") && field.defaultValue !== undefined) {
        value = field.defaultValue
      }

      if (field.required && (value === undefined || value === null || value === "")) {
        return { error: `${field.label} is required.` }
      }

      if (value === undefined || value === null || value === "") {
        continue
      }

      if (field.type === "number") {
        payload[field.name] = typeof value === "number" ? value : Number(value)
        continue
      }

      if (field.type === "select" && (field.lookup || field.name.endsWith("Id"))) {
        const normalized = typeof value === "number" ? value : Number(value)
        payload[field.name] = Number.isNaN(normalized) ? value : normalized
        continue
      }

      if (field.name === "partnerType") {
        payload.isVendor = value === "Vendor" || value === "Both"
        payload.isCustomer = value === "Customer" || value === "Both"
        continue
      }

      if (field.name === "mobileNumber" && apiKey === "business-partners") {
        payload.phone = value
        continue
      }

      payload[field.name] = value
    }

    if (formData.active !== undefined) {
      payload.active = !!formData.active
    }

    return { payload }
  }

  const handleSave = () => {
    setError(null)
    const result = buildPayload()

    if ("error" in result) {
      setError(result.error)
      const blanks = new Set(config.fields.filter((f) => f.required && !formData[f.name]).map((f) => f.name))
      setBlinkingFields(blanks)
      setBlinkVersion((v) => v + 1)
      return
    }

    setBlinkingFields(new Set())

    const { payload } = result

    if (editingId) {
      updateMutation.mutate({ id: editingId, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleEdit = (row: MasterRecord) => {
    const mapped = { ...row }
    if (apiKey === "business-partners") {
      const isV = !!mapped.isVendor
      const isC = !!mapped.isCustomer
      mapped.partnerType = isV && isC ? "Both" : isV ? "Vendor" : isC ? "Customer" : ""
      mapped.mobileNumber = mapped.phone
    }
    setFormData(mapped)
    setEditingId(row.id as number)
  }

  const handleDelete = (row: MasterRecord) => {
    setError(null)
    deleteMutation.mutate(row.id as number)
  }

  const handleToggleStatus = (row: MasterRecord) => {
    setError(null)
    const { id: _id, ...payload } = { ...row, active: !row.active } as MasterRecord
    updateMutation.mutate({ id: row.id as number, payload })
  }

  const handleClear = () => {
    resetForm()
    setEditingId(null)
    setError(null)
  }

  const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending
  const actionError = error || createMutation.error?.message || updateMutation.error?.message || deleteMutation.error?.message

  return (
    <div className="bg-surface text-on-surface">


      {/* Main Content */}
      <main className="pt-4 px-lg pb-xl min-h-screen w-full">
        <div className="flex flex-col gap-lg max-w-[1600px] mx-auto">
          {/* Page Header & Master Type Selector */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-md bg-white p-md rounded-xl border border-outline-variant shadow-sm">
            <div>
              <h2 className="font-headline-md text-headline-md text-primary">Master Management</h2>
              <p className="text-on-surface-variant font-body-sm">Configure system-wide parameters and core entity data</p>
            </div>
            <div className="flex items-center gap-md">
              <label className="font-label-md text-on-surface-variant">Active Master:</label>
              <div className="relative w-64">
                <select
                  className="w-full h-10 px-4 rounded border border-outline focus:border-primary focus:ring-1 focus:ring-primary font-title-md text-on-surface transition-all"
                  value={selectedMaster}
                  onChange={(e) => setSelectedMaster(e.target.value as MasterType)}
                >
                  {masterTypes.map((m) => (
                    <option key={m} value={m}>{MASTER_CONFIG[m].title}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 text-on-surface-variant py-2">
              <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
              <span className="font-body-sm">Loading records...</span>
            </div>
          )}

          {/* Error banner */}
          {actionError && (
            <div className="flex items-center gap-2 bg-error-container/30 text-error px-4 py-3 rounded-xl border border-error/20">
              <span className="material-symbols-outlined text-sm">error</span>
              <span className="font-body-sm flex-1">{actionError}</span>
              <button className="material-symbols-outlined text-sm" onClick={() => setError(null)}>close</button>
            </div>
          )}

          <div className="grid grid-cols-12 gap-lg">
            {/* Left: Form & Table */}
            <div className="col-span-12 xl:col-span-9 flex flex-col gap-lg">
              {/* Dynamic Form Panel */}
              <section className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
                <div className="bg-surface-container px-lg py-md border-b border-outline-variant flex justify-between items-center">
                  <h3 className="font-headline-sm text-headline-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">edit_note</span>
                    {editingId ? `Edit ${config.title}` : `Add New ${config.title}`}
                  </h3>
                  <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full font-label-md">
                    {editingId ? "Editing..." : "New Record"}
                  </span>
                </div>
                <div className="p-md md:p-lg grid grid-cols-1 md:grid-cols-2 gap-md md:gap-xl">
                  {config.fields.map((field) => (
                    <DynamicField
                      key={field.name}
                      field={field}
                      value={formData[field.name]}
                      onChange={handleChange}
                      options={field.lookup ? lookups[field.lookup] : undefined}
                      blink={field.required ? blinkingFields.has(field.name) : false}
                      blinkKey={field.required && blinkingFields.has(field.name) ? blinkVersion : 0}
                    />
                  ))}
                  <StatusToggle value={!!formData.active} onChange={(v) => handleChange("active", v)} />
                </div>
                <div className="bg-surface-container-low px-lg py-md flex justify-end gap-md">
                  <button className="px-6 py-2 border border-outline-variant font-label-md text-on-surface hover:bg-surface-container-high rounded transition-all active:scale-95" onClick={handleClear}>Clear</button>
                  <div className="flex gap-md">
                    {editingId && (
                      <button className="px-6 py-2 border border-primary text-primary font-label-md rounded hover:bg-surface-container-low transition-all active:scale-95" onClick={handleClear}>Cancel</button>
                    )}
                    <button
                      className="px-6 py-2 bg-primary text-on-primary font-label-md rounded hover:opacity-90 transition-all active:scale-95 shadow-md disabled:opacity-50"
                      onClick={handleSave}
                      disabled={isPending}
                    >
                      {isPending ? "Saving..." : editingId ? `Update ${config.title}` : `Save ${config.title}`}
                    </button>
                  </div>
                </div>
              </section>

              {/* Records Table */}
              <section className="bg-white rounded-xl border border-outline-variant shadow-sm flex flex-col">
                <div className="p-md border-b border-outline-variant flex flex-wrap gap-md items-center justify-between">
                  <div className="flex gap-md flex-1 min-w-[300px]">
                    <div className="relative flex-1">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                      <input
                        className="w-full pl-10 pr-4 py-2 border-outline-variant border rounded-lg focus:border-primary focus:ring-0 font-body-md"
                        placeholder="Search masters..."
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg hover:bg-surface-container-low transition-all">
                      <span className="material-symbols-outlined text-[20px]">filter_list</span>
                      <span className="font-label-md">Filters</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-md">
                    <button className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg hover:bg-surface-container-low transition-all">
                      <span className="material-symbols-outlined text-[20px]">download</span>
                      <span className="font-label-md">Export</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-all shadow-sm" onClick={handleClear}>
                      <span className="material-symbols-outlined text-[20px]">add</span>
                      <span className="font-label-md">Add New</span>
                    </button>
                  </div>
                </div>

                <DynamicTable
                  columns={config.columns}
                  tableKey={config.tableKey}
                  data={filteredRecords}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleStatus={handleToggleStatus}
                />

                <div className="p-md bg-surface-container-lowest border-t border-outline-variant flex items-center justify-between">
                  <span className="font-body-sm text-on-surface-variant">Showing 1 to {filteredRecords.length} of {records.length} records</span>
                  <div className="flex items-center gap-2">
                    <button className="p-1 border border-outline-variant rounded hover:bg-surface-container-low disabled:opacity-50" disabled>
                      <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <button className="px-3 py-1 border border-primary bg-primary text-on-primary rounded text-sm font-bold">1</button>
                    <button className="p-1 border border-outline-variant rounded hover:bg-surface-container-low disabled:opacity-50" disabled>
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>
                </div>
              </section>
            </div>

            {/* Right: Summary Panel */}
            <aside className="col-span-12 xl:col-span-3 flex flex-col gap-lg">
              <div className="grid grid-cols-1 gap-md">
                <div className="bg-white p-lg rounded-xl border border-outline-variant shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-on-surface-variant font-label-md uppercase tracking-tight">Total Records</p>
                      <h4 className="font-display-lg text-display-lg text-primary mt-1">{records.length}</h4>
                    </div>
                    <div className="bg-primary-fixed p-2 rounded-lg">
                      <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>list_alt</span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-green-600 gap-1 font-label-md">
                    <span className="material-symbols-outlined text-sm">trending_up</span>
                    <span>+{records.filter((r) => r.active).length} this month</span>
                  </div>
                </div>
                <div className="bg-white p-lg rounded-xl border border-outline-variant shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-on-surface-variant font-label-md uppercase tracking-tight">Active {lookupLabel(config.title)}</p>
                      <h4 className="font-display-lg text-display-lg text-secondary mt-1">{records.filter((r) => r.active).length}</h4>
                    </div>
                    <div className="bg-secondary-fixed p-2 rounded-lg">
                      <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    </div>
                  </div>
                  <div className="mt-4 w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                    <div className="bg-secondary h-full" style={{ width: `${records.length > 0 ? (records.filter((r) => r.active).length / records.length) * 100 : 0}%` }} />
                  </div>
                  <p className="mt-2 font-label-sm text-on-surface-variant">{records.length > 0 ? Math.round((records.filter((r) => r.active).length / records.length) * 100) : 0}% of total</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
                <div className="px-md py-4 border-b border-outline-variant flex items-center justify-between">
                  <h5 className="font-title-md text-title-md text-primary">Recently Added</h5>
                  <button className="text-primary font-label-md hover:underline">View All</button>
                </div>
                <div className="p-md space-y-lg">
                  {records.slice(-3).reverse().map((r, i) => (
                    <div key={i} className="flex items-center gap-md">
                      <div className="h-10 w-10 rounded bg-surface-container-highest flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary">inventory</span>
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="font-label-md text-on-surface truncate">{String(r[config.tableKey] ?? "")}</p>
                        <p className="text-[10px] text-on-surface-variant font-medium">Added recently</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-auto p-4 bg-surface-container-low border-t border-outline-variant">
                  <div className="w-full h-32 bg-gradient-to-br from-primary-container/40 to-surface-container-high rounded-lg flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-primary text-5xl opacity-50">database</span>
                  </div>
                  <p className="font-body-sm text-center text-on-surface-variant italic">System-wide Master Log active.</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  )
}
