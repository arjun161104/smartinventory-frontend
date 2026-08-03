import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import DynamicForm from "../../components/DynamicForm"
import { INWARD_GROSS_FIELDS } from "../../config/inwardConfig"
import { createGrossWeight, captureTareWeight } from "../../api/inwardApi"
import { businessPartnerApi, vehicleApi, siteApi, warehouseApi } from "../../api/masterApi"

const grossFormFields = INWARD_GROSS_FIELDS.filter((f) => f.section !== "measurement")

const defaultFormData: Record<string, unknown> = { bagCount: 450, grossWeight: 0 }

export default function WeighmentEntry() {
  const navigate = useNavigate()
  const [saved, setSaved] = useState(false)
  const [savedId, setSavedId] = useState<number | null>(null)
  const [formData, setFormData] = useState<Record<string, unknown>>({ ...defaultFormData })
  const [tareWeight, setTareWeight] = useState(0)
  const [lookups, setLookups] = useState<Record<string, { value: string; label: string }[]>>({})
  const [warehouseRecords, setWarehouseRecords] = useState<Record<string, unknown>[]>([])

  const netWeight = (Number(formData.grossWeight) || 0) - tareWeight

  useEffect(() => {
    Promise.all([
      businessPartnerApi.getAll().then((rows) => rows.map((r) => ({ value: String(r.id), label: String(r.name ?? "") }))),
      vehicleApi.getAll().then((rows) => rows.map((r) => ({ value: String(r.id), label: String(r.vehicleNumber ?? "") }))),
      siteApi.getAll().then((rows) => rows.map((r) => ({ value: String(r.id), label: String(r.siteName ?? r.name ?? "") }))),
      warehouseApi.getAll().then((rows) => { setWarehouseRecords(rows); return rows.map((r) => ({ value: String(r.id), label: String(r.warehouseName ?? r.name ?? "") })) }),
    ]).then(([businessPartners, vehicles, sites, warehouses]) => {
      setLookups({ businessPartners, vehicles, sites, warehouses })
    })
  }, [])

  const createMutation = useMutation({
    mutationFn: () =>
      createGrossWeight({
        vendorId: Number(formData.vendorId),
        vehicleId: Number(formData.vehicleId),
        siteId: Number(formData.siteId),
        warehouseId: Number(formData.warehouseId),
        grossWeight: Number(formData.grossWeight),
        bagCount: Number(formData.bagCount) || undefined,
      }),
    onSuccess: (data) => {
      setSavedId(data.id)
      setSaved(true)
      window.scrollTo(0, 0)
    },
  })

  const filteredWarehouses = useMemo(() => {
    if (!formData.siteId) return []
    const siteId = Number(formData.siteId)
    return warehouseRecords
      .filter((w) => Number(w.siteId) === siteId)
      .map((w) => ({ value: String(w.id), label: String(w.warehouseName ?? w.name ?? "") }))
  }, [formData.siteId, warehouseRecords])

  const derivedLookups = useMemo(() => ({
    ...lookups,
    warehouses: filteredWarehouses,
  }), [lookups, filteredWarehouses])

  const handleChange = (name: string, value: unknown) => {
    setFormData((prev) => {
      const next = { ...prev, [name]: value }
      if (name === "siteId") {
        next.warehouseId = undefined
      }
      return next
    })
  }

  const incrementBags = () => setFormData((prev) => ({ ...prev, bagCount: (Number(prev.bagCount) || 0) + 1 }))
  const decrementBags = () => setFormData((prev) => ({ ...prev, bagCount: Math.max(0, (Number(prev.bagCount) || 0) - 1) }))

  const saveEntry = () => {
    createMutation.mutate()
  }

  const resetEntry = () => {
    setFormData({ ...defaultFormData })
    setTareWeight(0)
    setSaved(false)
    setSavedId(null)
  }

  if (saved) {
    return (
      <div className="px-4 pb-8 space-y-6">
        <div className="bg-primary-container/10 border border-primary p-6 rounded-xl text-center">
          <span className="material-symbols-outlined text-primary text-5xl mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>
            check_circle
          </span>
          <h2 className="font-headline-sm text-headline-sm text-primary mb-1">Entry Saved Successfully</h2>
          <p className="text-on-surface-variant font-body-md">Draft Voucher Generated</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden">
          <div className="bg-surface-container px-4 py-3 border-b border-outline-variant flex justify-between items-center">
            <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">Voucher Details</span>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-dashed border-outline-variant">
              <span className="text-on-surface-variant font-body-md">Voucher No</span>
              <span className="font-bold font-title-md">#{savedId ? `VCH-${String(savedId).padStart(4, "0")}` : "New"}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-dashed border-outline-variant">
              <span className="text-on-surface-variant font-body-md">Gross Weight</span>
              <span className="font-bold font-title-md">{Number(formData.grossWeight).toLocaleString()}.00 kg</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-dashed border-outline-variant">
              <span className="text-on-surface-variant font-body-md">Vehicle</span>
              <span className="font-bold font-title-md uppercase">
                {lookups.vehicles?.find((v) => v.value === formData.vehicleId)?.label ?? "N/A"}
              </span>
            </div>
            <div className="bg-surface-container-high p-4 rounded-lg">
              <label className="block font-label-md text-label-md mb-2 text-on-surface-variant">Tare Weight (kg)</label>
              <div className="flex items-center gap-4">
                <input
                  className="flex-grow bg-white border border-primary rounded-lg h-12 px-3 text-body-lg font-bold focus:ring-0"
                  placeholder="Enter Tare..."
                  type="number"
                  value={tareWeight || ""}
                  onChange={(e) => setTareWeight(Number(e.target.value))}
                />
                <button className="active-state h-12 px-4 bg-primary text-white rounded-lg flex items-center gap-1 text-sm font-bold">
                  <span className="material-symbols-outlined text-sm">scale</span>
                  CAPTURE
                </button>
              </div>
            </div>
            {tareWeight > 0 && (
              <div className="flex justify-between items-center py-2 border-t border-outline-variant">
                <span className="text-on-surface-variant font-body-md">Net Weight</span>
                <span className="font-bold font-title-md text-primary">{netWeight.toLocaleString()}.00 kg</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button className="active-state w-full h-14 bg-primary-container text-on-primary-container font-bold rounded-lg flex items-center justify-center gap-2" onClick={resetEntry}>
            <span className="material-symbols-outlined">done_all</span>
            Complete Transaction
          </button>
          <button className="active-state w-full h-12 text-primary font-bold rounded-lg flex items-center justify-center gap-2" onClick={resetEntry}>
            <span className="material-symbols-outlined">print</span>
            Print Draft Token
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pb-8">
      <div className="flex items-center gap-4 mb-6">
        <button className="active-state p-2 -ml-2 text-primary" onClick={() => navigate("/dashboard")}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-headline-sm text-headline-sm font-bold text-primary">Weighment Entry</h1>
      </div>

      <div className="space-y-6">
        <DynamicForm fields={grossFormFields} data={formData} onChange={handleChange} lookups={derivedLookups} groupSections />

        <section className="bg-surface-container-lowest border border-outline-variant p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary text-body-lg">scale</span>
            <h2 className="font-title-md text-title-md text-primary">Measurement</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block font-label-md text-label-md mb-1 text-on-surface-variant">Gross Weight (kg)</label>
              <div className="relative">
                <input
                  className="w-full bg-surface-container border-2 border-primary rounded-lg h-16 px-4 text-display-lg font-bold text-primary focus:ring-0 text-right pr-12"
                  step="0.01"
                  type="number"
                  value={(formData.grossWeight as number) || ""}
                  onChange={(e) => handleChange("grossWeight", Number(e.target.value))}
                />
                <span className="absolute right-4 top-5 font-bold text-primary opacity-60">KG</span>
              </div>
            </div>
            <div>
              <label className="block font-label-md text-label-md mb-1 text-on-surface-variant">Bag Count</label>
              <div className="flex items-center gap-2 sm:gap-3">
                <button className="active-state w-12 h-12 sm:w-14 sm:h-14 bg-surface-variant rounded-lg flex items-center justify-center border border-outline-variant shrink-0" onClick={decrementBags}>
                  <span className="material-symbols-outlined">remove</span>
                </button>
                <input
                  className="flex-1 bg-white border border-outline rounded-lg h-12 sm:h-14 px-3 text-headline-sm font-bold text-center focus:border-primary focus:ring-0 min-w-0"
                  type="number"
                  value={Number(formData.bagCount)}
                  onChange={(e) => handleChange("bagCount", Number(e.target.value))}
                />
                <button className="active-state w-12 h-12 sm:w-14 sm:h-14 bg-surface-variant rounded-lg flex items-center justify-center border border-outline-variant shrink-0" onClick={incrementBags}>
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <button
          className="active-state w-full h-14 bg-primary-container text-on-primary-container font-bold rounded-lg flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          onClick={saveEntry}
          disabled={createMutation.isPending}
        >
          <span className="material-symbols-outlined">{createMutation.isPending ? "progress_activity" : "save"}</span>
          {createMutation.isPending ? "Saving..." : "Save Weighment"}
        </button>

        {createMutation.isError && (
          <p className="text-error text-body-sm bg-error-container/20 px-3 py-2 rounded-lg">
            {createMutation.error instanceof Error ? createMutation.error.message : "Failed to save weighment"}
          </p>
        )}
      </div>
    </div>
  )
}
