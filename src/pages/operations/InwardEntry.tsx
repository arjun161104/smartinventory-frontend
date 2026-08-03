import { useState, useEffect, useMemo } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import DynamicForm from "../../components/DynamicForm"
import StatusBadge from "../../components/StatusBadge"
import { INWARD_GROSS_FIELDS, INWARD_STATUSES } from "../../config/inwardConfig"
import { createGrossWeight, updateGrossWeight, captureTareWeight, getAllInwards, type InwardResponse } from "../../api/inwardApi"
import { businessPartnerApi, vehicleApi, siteApi, warehouseApi, itemApi } from "../../api/masterApi"

const grossFormFields = INWARD_GROSS_FIELDS.filter((f) => f.section !== "measurement")
const logisticsFields = grossFormFields.filter((f) => f.section === "logistics")
const locationFields = grossFormFields.filter((f) => f.section === "location")

const spinnerHide = `
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: inner-spin-button !important;
  appearance: inner-spin-button !important;
  background: transparent !important;
  background-image: none !important;
  opacity: 1 !important;
  border: none !important;
}
`
const todayLocal = new Date()
const y = todayLocal.getFullYear()
const m = String(todayLocal.getMonth() + 1).padStart(2, "0")
const d = String(todayLocal.getDate()).padStart(2, "0")
const defaultFormData: Record<string, unknown> = { bagCount: 0, grossWeight: 0, inwardDate: `${y}-${m}-${d}` }

const sidebarLinks = [
  { icon: "database", label: "Masters", path: "/masters" },
  { icon: "precision_manufacturing", label: "Operations", path: "/operations", active: true },
  { icon: "inventory_2", label: "Inventory", path: "/inventory" },
  { icon: "account_balance", label: "Accounts", path: "/accounts" },
  { icon: "assessment", label: "Reports", path: "/reports" },
  { icon: "settings", label: "Settings", path: "/settings" },
]

export default function InwardEntry() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const location = useLocation()
  const editEntry = (location.state as { editEntry?: InwardResponse })?.editEntry
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [formData, setFormData] = useState<Record<string, unknown>>(
    editEntry
      ? {
          ...defaultFormData,
          vendorId: String(editEntry.vendorId),
          itemId: String(editEntry.itemId ?? ""),
          vehicleId: String(editEntry.vehicleId),
          siteId: String(editEntry.siteId),
          warehouseId: String(editEntry.warehouseId ?? ""),
          receiptRef: editEntry.receiptRef ?? "",
          inwardDate: editEntry.inwardDate ?? defaultFormData.inwardDate,
          ackNo: editEntry.ackNo ?? "",
          ackDate: editEntry.ackDate ?? "",
          grossWeight: editEntry.grossWeight,
          bagCount: editEntry.bagCount ?? 0,
        }
      : { ...defaultFormData }
  )
  const [tareWeight, setTareWeight] = useState(editEntry?.tareWeight ?? 0)
  const [editingId, setEditingId] = useState<number | null>(editEntry?.id ?? null)
  const [nbgBags, setNbgBags] = useState(editEntry?.nbgBags ?? 100)
  const [ssgBags, setSsgBags] = useState(editEntry?.ssgBags ?? 100)
  const [swpBags, setSwpBags] = useState(editEntry?.swpBags ?? 100)
  const [onbgBags, setOnbgBags] = useState(editEntry?.onbgBags ?? 100)
  const [unbgBags, setUnbgBags] = useState(editEntry?.unbgBags ?? 100)
  const [lookups, setLookups] = useState<Record<string, { value: string; label: string }[]>>({})
  const [warehouseRecords, setWarehouseRecords] = useState<Record<string, unknown>[]>([])
  const [vendorRecords, setVendorRecords] = useState<Record<string, unknown>[]>([])
  const [itemRecords, setItemRecords] = useState<Record<string, unknown>[]>([])
  const [viewEntry, setViewEntry] = useState<InwardResponse | null>(null)

  useEffect(() => {
    if (viewEntry) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [viewEntry])

  const totalBags = nbgBags + ssgBags + swpBags + onbgBags + unbgBags

  const selectedVendor = useMemo(() => {
    if (!formData.vendorId) return null
    return vendorRecords.find((v) => Number(v.id) === Number(formData.vendorId)) ?? null
  }, [formData.vendorId, vendorRecords])

  const selectedItem = useMemo(() => {
    if (!formData.itemId) return null
    return itemRecords.find((i) => Number(i.id) === Number(formData.itemId)) ?? null
  }, [formData.itemId, itemRecords])

  const netWeight = useMemo(() => {
    const gw = Number(formData.grossWeight) || 0
    return Math.max(0, gw - (tareWeight || 0))
  }, [formData.grossWeight, tareWeight])

  useEffect(() => {
    Promise.all([
      businessPartnerApi.getAll().then((rows) => { setVendorRecords(rows); return rows.map((r) => ({ value: String(r.id), label: String(r.name ?? "") })) }),
      vehicleApi.getAll().then((rows) => rows.map((r) => ({ value: String(r.id), label: String(r.vehicleNumber ?? "") }))),
      siteApi.getAll().then((rows) => rows.map((r) => ({ value: String(r.id), label: String(r.siteName ?? r.name ?? "") }))),
      warehouseApi.getAll().then((rows) => { setWarehouseRecords(rows); return rows.map((r) => ({ value: String(r.id), label: String(r.warehouseName ?? r.name ?? "") })) }),
      itemApi.getAll().then((rows) => { setItemRecords(rows); return rows.map((r) => ({ value: String(r.id), label: String(r.itemName ?? "") })) }),
    ]).then(([businessPartners, vehicles, sites, warehouses, items]) => {
      setLookups({ businessPartners, vehicles, sites, warehouses, items })
    })
  }, [])

  const { data: weighments = [] } = useQuery({
    queryKey: ["inwards"],
    queryFn: async () => {
      try {
        const data = await getAllInwards()
        return data.map((w) => ({
          ...w,
          status: w.tareWeight != null ? "COMPLETED" : "PENDING",
        }))
      } catch {
        return []
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  })

  const filteredWeighments = useMemo(() => {
    const vendorId = Number(formData.vendorId)
    if (!vendorId) return weighments
    return weighments.filter((w) => Number(w.vendorId) === vendorId)
  }, [weighments, formData.vendorId])

  const pendingInward = useMemo(() => {
    return [...filteredWeighments]
      .sort((a, b) => {
        if (a.status === "PENDING" && b.status !== "PENDING") return -1
        if (a.status !== "PENDING" && b.status === "PENDING") return 1
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
      .slice(0, 10)
  }, [filteredWeighments])

  const kpis = useMemo(() => {
    const vendorSelected = Number(formData.vendorId) > 0
    const received = filteredWeighments.filter((w) => w.status === "COMPLETED" || w.status === "QC_PENDING")
    const receivedQty = received.reduce((s, w) => s + (w.netWeight || 0), 0)
    return {
      overallQty: weighments.reduce((s, w) => s + (w.grossWeight || 0), 0),
      receivedQty: vendorSelected ? receivedQty : 0,
      currentReceipt: netWeight,
      expectedQty: vendorSelected ? receivedQty + netWeight : netWeight,
    }
  }, [weighments, filteredWeighments, netWeight, formData.vendorId])

  const vendorTotalBags = useMemo(() => {
    const vendorId = Number(formData.vendorId)
    if (!vendorId) return 0
    return weighments
      .filter((w) => Number(w.vendorId) === vendorId && w.id !== editingId)
      .reduce((s, w) => s + (w.bagCount || 0), 0)
  }, [weighments, formData.vendorId, editingId])
  const totalNumberOfBags = totalBags + vendorTotalBags

  const createMutation = useMutation({
    mutationFn: () =>
      createGrossWeight({
        vendorId: Number(formData.vendorId),
        vehicleId: Number(formData.vehicleId),
        itemId: Number(formData.itemId),
        siteId: Number(formData.siteId),
        warehouseId: Number(formData.warehouseId),
        receiptRef: String(formData.receiptRef ?? ""),
        inwardDate: formData.inwardDate ? String(formData.inwardDate) : undefined,
        ackNo: String(formData.ackNo ?? ""),
        ackDate: formData.ackDate ? String(formData.ackDate) : undefined,
        grossWeight: Number(formData.grossWeight),
        bagCount: totalBags || undefined,
        nbgBags,
        ssgBags,
        swpBags,
        onbgBags,
        unbgBags,
      }),
  })

  const updateMutation = useMutation({
    mutationFn: () =>
      updateGrossWeight(editingId!, {
        vendorId: Number(formData.vendorId),
        vehicleId: Number(formData.vehicleId),
        itemId: Number(formData.itemId) || undefined,
        siteId: Number(formData.siteId),
        warehouseId: Number(formData.warehouseId) || undefined,
        receiptRef: String(formData.receiptRef ?? ""),
        inwardDate: formData.inwardDate ? String(formData.inwardDate) : undefined,
        ackNo: String(formData.ackNo ?? ""),
        ackDate: formData.ackDate ? String(formData.ackDate) : undefined,
        grossWeight: Number(formData.grossWeight),
        bagCount: totalBags || undefined,
        nbgBags,
        ssgBags,
        swpBags,
        onbgBags,
        unbgBags,
      }),
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

  const canSave = useMemo(() => {
    const gw = Number(formData.grossWeight)
    return gw > 0
  }, [formData.grossWeight])

  const handleSave = async () => {
    if (!canSave) return
    const currentEditId = editingId
    const currentTare = tareWeight
    try {
      let entryId: number
      if (currentEditId) {
        const result = await updateMutation.mutateAsync()
        entryId = currentEditId
      } else {
        const result = await createMutation.mutateAsync()
        entryId = result.id
      }
      if (currentTare > 0) {
        await captureTareWeight(entryId, { tareWeight: currentTare })
      }
      setEditingId(null)
      setFormData({ ...defaultFormData })
      setTareWeight(0)
      setNbgBags(100)
      setSsgBags(100)
      setSwpBags(100)
      setOnbgBags(100)
      setUnbgBags(100)
      queryClient.invalidateQueries({ queryKey: ["inwards"] })
    } catch {
      // errors handled by mutation state
    }
  }

  const statusInfo = (status: string) => {
    const match = INWARD_STATUSES.find((s) => s.value === status)
    return match?.label ?? status
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-container-margin h-14 bg-surface border-b border-outline-variant">
        <div className="flex items-center gap-md">
          <button className="material-symbols-outlined text-primary hover:bg-surface-container-high transition-colors p-2 rounded-full" onClick={() => setSidebarOpen(v => !v)}>
            menu
          </button>
          <h1 className="font-headline-sm text-headline-sm font-bold text-primary">SmartInventory</h1>
        </div>
        <div className="flex items-center gap-md">
          <button className="material-symbols-outlined text-on-surface-variant hover:bg-surface-container-high transition-colors p-2 rounded-full">search</button>
          <button className="material-symbols-outlined text-on-surface-variant hover:bg-surface-container-high transition-colors p-2 rounded-full">notifications</button>
          <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs">AD</div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 bottom-0 z-[60] flex flex-col py-lg w-64 bg-surface-container-lowest border-r border-outline-variant transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 transition-transform duration-300`}>
        <div className="px-lg mb-xl">
          <h2 className="font-headline-sm text-headline-sm font-bold text-primary">SmartInventory ERP</h2>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {sidebarLinks.map((item) => (
            <a
              key={item.label}
              className={`flex items-center gap-md mx-2 px-4 py-3 rounded-full transition-all cursor-pointer ${
                item.active
                  ? "bg-primary-container text-on-primary-container font-bold"
                  : "text-on-surface-variant hover:bg-surface-container"
              }`}
              onClick={() => navigate(item.path)}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-label-md text-label-md">{item.label}</span>
            </a>
          ))}
        </nav>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-[55] bg-black/30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <main className="md:ml-64 pt-20 pb-32 px-container-margin">
        {/* Breadcrumbs & Header */}
        <div className="flex items-center justify-between mb-lg">
          <div>
            <nav className="flex items-center gap-xs text-[11px] font-label-sm text-on-surface-variant mb-xs">
              <button className="hover:text-primary transition-colors" onClick={() => navigate("/operations")}>Operations</button>
              <span className="material-symbols-outlined text-[12px]">chevron_right</span>
              <span className="text-primary font-bold">Inward Entry</span>
            </nav>
            <h2 className="font-headline-md text-headline-md text-on-surface">Paddy Receipt / Inward Entry</h2>
          </div>
          <button
            className="border border-outline px-lg py-2 rounded text-sm font-bold flex items-center gap-2 hover:bg-surface-container-low transition-colors"
            onClick={() => navigate("/operations/inward-history")}
          >
            <span className="material-symbols-outlined text-[20px]">history</span>
            View History
          </button>
        </div>

        {/* KPI Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter mb-lg">
          <div className="bg-surface-container-lowest border border-outline-variant p-md rounded flex flex-col gap-xs">
            <span className="text-on-surface-variant font-label-md text-label-md">Overall Qty (KG)</span>
            <span className="font-display-lg text-display-lg text-error industrial-numeric">{kpis.overallQty.toFixed(2)}</span>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant p-md rounded flex flex-col gap-xs">
            <span className="text-on-surface-variant font-label-md text-label-md">Received Qty (KG)</span>
            <span className="font-display-lg text-display-lg text-on-surface industrial-numeric">{kpis.receivedQty.toFixed(2)}</span>
          </div>
          <div className="bg-primary text-on-primary p-md rounded flex flex-col gap-xs shadow-md">
            <span className="text-primary-fixed font-label-md text-label-md">Current Receipt (KG)</span>
            <span className="font-display-lg text-display-lg industrial-numeric">{kpis.currentReceipt.toFixed(2)}</span>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant p-md rounded flex flex-col gap-xs">
            <span className="text-on-surface-variant font-label-md text-label-md">Expected Qty (KG)</span>
            <span className="font-display-lg text-display-lg text-on-surface industrial-numeric">{kpis.expectedQty.toFixed(2)}</span>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-lg items-start">
              {/* Left Column: Form */}
              <div className="col-span-12 lg:col-span-8 space-y-gutter">
                {/* Logistics (Dynamic Form) */}
                <DynamicForm fields={logisticsFields} data={formData} onChange={handleChange} lookups={derivedLookups} groupSections sectionExtra={{
                  logistics: selectedItem ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-md text-sm">
                      <div>
                        <span className="text-on-surface-variant text-[11px] uppercase block">Item Code</span>
                        <span className="font-bold">{String(selectedItem.itemCode ?? "")}</span>
                      </div>
                      <div>
                        <span className="text-on-surface-variant text-[11px] uppercase block">Item Type</span>
                        <span className="font-bold">{String(selectedItem.itemType ?? "")}</span>
                      </div>
                      <div>
                        <span className="text-on-surface-variant text-[11px] uppercase block">UOM</span>
                        <span className="font-bold">{String(selectedItem.uomName ?? selectedItem.uomCode ?? "")}</span>
                      </div>
                      <div>
                        <span className="text-on-surface-variant text-[11px] uppercase block">Outturn %</span>
                        <span className="font-bold">{selectedItem.outturnPercent != null ? `${selectedItem.outturnPercent}%` : "—"}</span>
                      </div>
                    </div>
                  ) : null
                }} />

                {/* Receipt Reference */}
                <section className="bg-white border border-outline-variant rounded p-lg">
                  <div className="flex items-center gap-2 mb-md border-b border-outline-variant pb-2">
                    <span className="material-symbols-outlined text-primary">receipt_long</span>
                    <h3 className="font-title-md text-title-md text-primary">Receipt Reference</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                    <div className="flex flex-col gap-xs">
                      <label className="font-label-md text-label-md text-on-surface-variant">Receipt Ref/Inward Memo <span className="text-error">*</span></label>
                      <div className="relative">
                        <input className="w-full px-3 py-2 border-outline border rounded focus:border-primary focus:ring-1 focus:ring-primary-container outline-none transition-all font-body-md bg-surface-bright text-on-surface" placeholder="Memo No." type="text" required value={(formData.receiptRef as string) || ""} onChange={e => handleChange("receiptRef", e.target.value)} onFocus={e => e.target.select()} />
                      </div>
                    </div>
                    <div className="flex flex-col gap-xs">
                      <label className="font-label-md text-label-md text-on-surface-variant">Inward Date <span className="text-error">*</span></label>
                      <input className="w-full px-3 py-2 border-outline border rounded focus:border-primary focus:ring-1 focus:ring-primary-container outline-none transition-all font-body-md bg-surface-bright text-on-surface" type="date" required value={(formData.inwardDate as string) || ""} onChange={e => handleChange("inwardDate", e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-xs">
                      <label className="font-label-md text-label-md text-on-surface-variant">Ack No.</label>
                      <input className="w-full px-3 py-2 border-outline border rounded focus:border-primary focus:ring-1 focus:ring-primary-container outline-none transition-all font-body-md bg-surface-bright text-on-surface" placeholder="ACK8829" type="text" value={(formData.ackNo as string) || ""} onChange={e => handleChange("ackNo", e.target.value)} onFocus={e => e.target.select()} />
                    </div>
                    <div className="flex flex-col gap-xs">
                      <label className="font-label-md text-label-md text-on-surface-variant">Ack Date</label>
                      <input className="w-full px-3 py-2 border-outline border rounded focus:border-primary focus:ring-1 focus:ring-primary-container outline-none transition-all font-body-md bg-surface-bright text-on-surface" type="date" value={(formData.ackDate as string) || ""} onChange={e => handleChange("ackDate", e.target.value)} />
                    </div>
                  </div>
                </section>

                {/* Location (Dynamic Form) */}
                <DynamicForm fields={locationFields} data={formData} onChange={handleChange} lookups={derivedLookups} groupSections />

                {/* Remarks — disabled for now */}
                {/* <section className="bg-white border border-outline-variant rounded p-lg">
                  <label className="font-label-md text-label-md text-on-surface-variant mb-xs block">Remarks / Special Instructions</label>
                  <textarea className="w-full border border-outline-variant rounded p-sm text-sm input-focus h-24" placeholder="Mention moisture levels, bag quality concerns, or delay reasons..." onFocus={e => e.target.select()} />
                </section> */}

                {(createMutation.isError || updateMutation.isError) && (
                  <p className="text-error text-body-sm bg-error-container/20 px-3 py-2 rounded-lg">
                    {createMutation.error instanceof Error ? createMutation.error.message : updateMutation.error instanceof Error ? updateMutation.error.message : "Failed to save entry"}
                  </p>
                )}
              </div>

              {/* Right Column: Weighment Summary */}
              <div className="col-span-12 lg:col-span-4 space-y-gutter">
                <div className="bg-inverse-surface text-white p-lg rounded-xl shadow-md">
                  <h3 className="font-label-md text-label-md uppercase tracking-widest opacity-60 mb-md flex items-center gap-xs">
                    <span className="material-symbols-outlined text-sm">weight</span>
                    Live Weighment Data
                  </h3>
                  <div className="space-y-md">
                    <div className="flex justify-between items-center bg-white/5 p-md rounded-lg border border-white/10">
                      <span className="text-xs font-label-sm uppercase">Gross Weight <span className="text-secondary-fixed">*</span></span>
                      <div className="flex items-baseline gap-xs">
                        <input
                          className="text-2xl font-bold bg-transparent text-white text-right w-28 border border-white/30 outline-none rounded px-2"
                          style={{ fontFamily: "'Courier New', monospace", letterSpacing: "-0.05em", colorScheme: "dark" }}
                          type="number"
                          step="0.001"
                          value={(formData.grossWeight as number) || ""}
                          onChange={e => handleChange("grossWeight", Number(e.target.value))}
                          onFocus={e => e.target.select()}
                        />
                        <span className="text-[10px] opacity-60">KG</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-white/5 p-md rounded-lg border border-white/10">
                      <span className="text-xs font-label-sm uppercase">Tare Weight</span>
                      <div className="flex items-baseline gap-xs">
                        <input
                          className="text-2xl font-bold bg-transparent text-white text-right w-28 border border-white/30 outline-none rounded px-2"
                          style={{ fontFamily: "'Courier New', monospace", letterSpacing: "-0.05em", colorScheme: "dark" }}
                          type="number"
                          step="0.001"
                          value={tareWeight || ""}
                          onChange={e => setTareWeight(Number(e.target.value))}
                          onFocus={e => e.target.select()}
                        />
                        <span className="text-[10px] opacity-60">KG</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-primary-container text-on-primary-container p-md rounded-lg ring-1 ring-white/20">
                      <span className="text-xs font-bold uppercase">Net Weight <span className="text-[8px] opacity-70 block">(Auto-Calc)</span></span>
                      <div className="flex items-baseline gap-xs">
                        <span className="text-3xl font-bold" style={{ fontFamily: "'Courier New', monospace", letterSpacing: "-0.05em" }}>{netWeight.toFixed(3)}</span>
                        <span className="text-[10px]">KG</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-container-high border border-outline-variant p-lg rounded-xl">
                  <h3 className="font-title-md text-title-md mb-md flex items-center gap-xs">
                    <span className="material-symbols-outlined text-primary">conveyor_belt</span>
                    Bag Configuration
                  </h3>
                  <div className="grid grid-cols-3 gap-sm mb-md">
                    {[
                      { label: "NBG", desc: "New Bag", value: nbgBags, setter: setNbgBags },
                      { label: "SSG", desc: "Sound Servicable Guni", value: ssgBags, setter: setSsgBags },
                      { label: "SWP", desc: "Stiched With Patches", value: swpBags, setter: setSwpBags },
                    ].map((bag) => (
                      <div key={bag.label} className="text-center">
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase mb-1" title={bag.desc}>{bag.label}</p>
                        <input className="w-full bg-white border border-outline rounded p-sm text-center font-bold" type="number" value={bag.value} onChange={e => bag.setter(Math.max(0, Number(e.target.value)))} onFocus={e => e.target.select()} />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-sm mb-md">
                    {[
                      { label: "ONBG", desc: "One Used Bags", value: onbgBags, setter: setOnbgBags },
                      { label: "UNBG", desc: "Unused Bags", value: unbgBags, setter: setUnbgBags },
                    ].map((bag) => (
                      <div key={bag.label} className="text-center">
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase mb-1" title={bag.desc}>{bag.label}</p>
                        <input className="w-full bg-white border border-outline rounded p-sm text-center font-bold" type="number" value={bag.value} onChange={e => bag.setter(Math.max(0, Number(e.target.value)))} onFocus={e => e.target.select()} />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-sm text-sm">
                    <div className="flex justify-between border-b border-outline-variant/30 pb-1">
                      <span className="text-on-surface-variant">Number of Bags</span>
                      <span className="font-bold">{totalBags}</span>
                    </div>
                    <div className="flex justify-between border-b border-outline-variant/30 pb-1">
                      <span className="text-on-surface-variant">Total Number of Bags</span>
                      <span className="font-bold">{totalNumberOfBags.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-primary font-bold">
                      <span>Balance Bags Due</span>
                      <span>{vendorTotalBags.toLocaleString()}</span>
                    </div>
                  </div>
                </div>


              </div>
            </div>

            {/* Pending Inward Table */}
            <div className="mt-xl bg-white border border-outline-variant rounded shadow-sm overflow-hidden">
              <div className="p-lg border-b border-outline-variant flex items-center justify-between">
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Pending / Recent Inward List</h3>
                <span className="text-xs text-on-surface-variant">{weighments.length} entries</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-surface-container-low text-[11px] font-bold uppercase text-on-surface-variant tracking-wider">
                    <tr>
                      <th className="px-lg py-md">Voucher #</th>
                      <th className="px-lg py-md">Vendor / Vehicle</th>
                      <th className="px-lg py-md">Gross Wt</th>
                      <th className="px-lg py-md">Net Wt</th>
                      {/* <th className="px-lg py-md">Status</th> */}
                      <th className="px-lg py-md text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant text-sm">
                    {pendingInward.length === 0 ? (
                      <tr><td colSpan={5} className="px-lg py-md text-center text-on-surface-variant">No records found</td></tr>
                    ) : (
                      pendingInward.map((row) => (
                        <tr key={row.id} className="hover:bg-surface-container-lowest transition-colors">
                          <td className="px-lg py-md font-bold text-primary">{row.voucherNo}</td>
                          <td className="px-lg py-md">
                            <div className="font-bold">{row.vendorName}</div>
                            <div className="text-[11px] text-on-surface-variant">{row.vehicleNumber}</div>
                          </td>
                          <td className="px-lg py-md industrial-numeric">{row.grossWeight.toFixed(2)}</td>
                          <td className="px-lg py-md industrial-numeric">{row.netWeight ? row.netWeight.toFixed(2) : "—"}</td>
                          {/* <td className="px-lg py-md">
                            <StatusBadge value={row.status} statuses={INWARD_STATUSES} />
                          </td> */}
                          <td className="px-lg py-md">
                            <div className="flex items-center justify-center gap-sm">
                              <button className="p-1.5 hover:bg-surface-container-low rounded" onClick={() => setViewEntry(row)}>
                                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">visibility</span>
                              </button>
                              <button className="p-1.5 hover:bg-surface-container-low rounded" onClick={() => {
                                setEditingId(row.id)
                                setFormData({
                                  ...defaultFormData,
                                  vendorId: String(row.vendorId),
                                  itemId: String(row.itemId ?? ""),
                                  vehicleId: String(row.vehicleId),
                                  siteId: String(row.siteId),
                                  warehouseId: String(row.warehouseId ?? ""),
                                  receiptRef: row.receiptRef ?? "",
                                  inwardDate: row.inwardDate ?? defaultFormData.inwardDate,
                                  ackNo: row.ackNo ?? "",
                                  ackDate: row.ackDate ?? "",
                                  grossWeight: row.grossWeight,
                                  bagCount: row.bagCount ?? 0,
                                })
                                setTareWeight(row.tareWeight ?? 0)
                                setNbgBags(row.nbgBags ?? 0)
                                setSsgBags(row.ssgBags ?? 0)
                                setSwpBags(row.swpBags ?? 0)
                                setOnbgBags(row.onbgBags ?? 0)
                                setUnbgBags(row.unbgBags ?? 0)
                              }}><span className="material-symbols-outlined text-[18px] text-primary">edit</span></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
      </main>
      {/* Action Bar (Sticky Bottom) */}
        <footer className="fixed bottom-0 left-0 md:left-64 right-0 bg-surface border-t border-outline-variant p-md flex items-center justify-end shadow-[0_-4px_6px_-1px(0,0,0,0.05)] z-50 px-lg">
          {editingId && (
            <button className="mr-auto text-sm text-on-surface-variant hover:text-primary transition-colors" onClick={() => { setEditingId(null); setFormData({ ...defaultFormData }); setNbgBags(100); setSsgBags(100); setSwpBags(100); setOnbgBags(100); setUnbgBags(100) }}>
              Cancel Edit
            </button>
          )}
          <button
            className="px-xl py-2 rounded bg-primary text-on-primary font-bold text-sm hover:opacity-90 transition-all shadow-md active:scale-95 disabled:opacity-50"
            onClick={handleSave}
            disabled={!canSave || createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingId ? "Update Entry" : "Save & Proceed"}
          </button>
        </footer>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-[70] flex justify-around items-center px-md pb-xs h-16 bg-surface border-t border-outline-variant shadow-2xl">
        <button className="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1" onClick={() => navigate("/dashboard")}>
          <span className="material-symbols-outlined">dashboard</span>
          <span className="font-label-sm text-label-sm">Dashboard</span>
        </button>
        <button className="flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-full px-4 py-1 scale-90 transition-transform" onClick={() => navigate("/operations")}>
          <span className="material-symbols-outlined">conveyor_belt</span>
          <span className="font-label-sm text-label-sm">Operations</span>
        </button>
        <button className="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1" onClick={() => navigate("/inventory")}>
          <span className="material-symbols-outlined">warehouse</span>
          <span className="font-label-sm text-label-sm">Inventory</span>
        </button>
      </nav>

      {/* View Entry Modal */}
      {viewEntry && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" onClick={() => setViewEntry(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-lg border-b border-outline-variant sticky top-0 bg-white">
              <div>
                <h3 className="font-headline-sm text-headline-sm">Entry Details</h3>
                <p className="text-sm text-on-surface-variant">{viewEntry.voucherNo}</p>
              </div>
              <button className="p-1.5 hover:bg-surface-container-low rounded" onClick={() => setViewEntry(null)}>
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            <div className="p-lg space-y-md text-sm">
              <div className="grid grid-cols-2 gap-md">
                <DetailField label="Voucher No" value={viewEntry.voucherNo} />
                <DetailField label="Vendor" value={viewEntry.vendorName} />
                <DetailField label="Vehicle" value={viewEntry.vehicleNumber} />
                <DetailField label="Item" value={viewEntry.itemName ?? "—"} />
                <DetailField label="Item Code" value={viewEntry.itemCode ?? "—"} />
                <DetailField label="Site" value={viewEntry.siteName} />
                <DetailField label="Warehouse" value={viewEntry.warehouseName ?? "—"} />
                <DetailField label="Receipt Ref" value={viewEntry.receiptRef ?? "—"} />
                <DetailField label="Inward Date" value={viewEntry.inwardDate ?? "—"} />
                <DetailField label="Ack No" value={viewEntry.ackNo ?? "—"} />
                <DetailField label="Ack Date" value={viewEntry.ackDate ?? "—"} />
                <DetailField label="Gross Weight" value={`${viewEntry.grossWeight.toFixed(2)} kg`} />
                <DetailField label="Tare Weight" value={viewEntry.tareWeight != null ? `${viewEntry.tareWeight.toFixed(2)} kg` : "—"} />
                <DetailField label="Net Weight" value={viewEntry.netWeight != null ? `${viewEntry.netWeight.toFixed(2)} kg` : "—"} />
                <DetailField label="Bag Count" value={String(viewEntry.bagCount ?? "—")} />
              </div>
              <div className="border-t border-outline-variant pt-md">
                <p className="font-label-md text-label-md text-on-surface-variant mb-sm">Bag Breakdown</p>
                <div className="grid grid-cols-5 gap-sm text-center">
                  <BagBadge label="NBG" value={viewEntry.nbgBags ?? 0} />
                  <BagBadge label="SSG" value={viewEntry.ssgBags ?? 0} />
                  <BagBadge label="SWP" value={viewEntry.swpBags ?? 0} />
                  <BagBadge label="ONBG" value={viewEntry.onbgBags ?? 0} />
                  <BagBadge label="UNBG" value={viewEntry.unbgBags ?? 0} />
                </div>
              </div>
              <div className="border-t border-outline-variant pt-md grid grid-cols-2 gap-md text-[11px] text-on-surface-variant">
                <DetailField label="Created By" value={viewEntry.createdBy} />
                <DetailField label="Created At" value={viewEntry.createdAt ? new Date(viewEntry.createdAt).toLocaleString() : "—"} />
                {viewEntry.grossWeightTime && <DetailField label="Gross Weight Time" value={new Date(viewEntry.grossWeightTime).toLocaleString()} />}
                {viewEntry.tareWeightTime && <DetailField label="Tare Weight Time" value={new Date(viewEntry.tareWeightTime).toLocaleString()} />}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-label-md">{label}</span>
      <span className="font-bold text-on-surface">{value}</span>
    </div>
  )
}

function BagBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-surface-container-lowest rounded p-sm border border-outline-variant">
      <p className="text-[10px] text-on-surface-variant font-bold uppercase">{label}</p>
      <p className="font-bold text-lg">{value}</p>
    </div>
  )
}
