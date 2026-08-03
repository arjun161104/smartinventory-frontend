import { useState, useEffect, useMemo, useCallback } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getAllInwards } from "../../api/inwardApi"
import { getAllDispatches, createDispatch, updateDispatch, type DispatchResponse } from "../../api/outwardApi"
import { businessPartnerApi, vehicleApi, siteApi, warehouseApi, itemApi } from "../../api/masterApi"
import PageHeader from "../../components/PageHeader"

export default function OutwardEntry() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const location = useLocation()
  const editEntry = (location.state as { editEntry?: DispatchResponse })?.editEntry
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Lookups
  const [sites, setSites] = useState<Record<string, unknown>[]>([])
  const [warehouses, setWarehouses] = useState<Record<string, unknown>[]>([])
  const [customers, setCustomers] = useState<Record<string, unknown>[]>([])
  const [vehicles, setVehicles] = useState<Record<string, unknown>[]>([])
  const [items, setItems] = useState<Record<string, unknown>[]>([])

  useEffect(() => {
    Promise.all([
      siteApi.getAll(),
      warehouseApi.getAll(),
      businessPartnerApi.getAll({ type: "customer" }),
      vehicleApi.getAll(),
      itemApi.getAll(),
    ]).then(([s, w, c, v, i]) => {
      setSites(s)
      setWarehouses(w)
      setCustomers(c)
      setVehicles(v)
      setItems(i)
    })
  }, [])

  // Inward Paddy Data
  const { data: inwards = [] } = useQuery({
    queryKey: ["inwards"],
    queryFn: async () => {
      try { return await getAllInwards() }
      catch { return [] }
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchInterval: 10_000,
    staleTime: 30_000,
  })

  // Dispatch Data
  const { data: dispatches = [] } = useQuery({
    queryKey: ["dispatches"],
    queryFn: async () => {
      try { return await getAllDispatches() }
      catch { return [] }
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchInterval: 10_000,
    staleTime: 30_000,
  })

  const totalPaddyDeposited = useMemo(() =>
    inwards.reduce((s, w) => s + (w.netWeight || 0), 0),
    [inwards]
  )

  const totalRiceDispatched = useMemo(() =>
    dispatches.reduce((s, d) => {
      const item = items.find((i) => Number(i.id) === d.itemId)
      if (String(item?.itemType ?? "") === "FINISHED_GOOD") return s + (d.netWeight || 0)
      return s
    }, 0),
    [dispatches, items]
  )

  const paddyEquivalent = useCallback((itemId: number | null, netWt: number) => {
    if (!itemId || !netWt) return 0
    const item = items.find((i) => Number(i.id) === itemId)
    const itemType = String(item?.itemType ?? "")
    if (itemType === "RAW_MATERIAL") return netWt
    if (itemType === "FINISHED_GOOD") {
      const outturn = Number(item?.outturnPercent ?? item?.outturn ?? 0)
      if (outturn <= 0) return 0
      return netWt * 100 / outturn
    }
    return 0
  }, [items])

  // Form State
  const todayLocal = new Date()
  const todayStr = `${todayLocal.getFullYear()}-${String(todayLocal.getMonth() + 1).padStart(2, "0")}-${String(todayLocal.getDate()).padStart(2, "0")}`
  const [formData, setFormData] = useState(
    editEntry
      ? {
          siteId: String(editEntry.siteId ?? ""),
          warehouseId: String(editEntry.warehouseId ?? ""),
          customerId: String(editEntry.customerId ?? ""),
          vehicleId: String(editEntry.vehicleId ?? ""),
          driverName: editEntry.driverName ?? "",
          sampleNo: editEntry.sampleNo ?? "",
          itemId: String(editEntry.itemId ?? ""),
          dispatchDate: editEntry.dispatchDate ?? todayStr,
          frkRequired: editEntry.frkRequired ? "yes" : "no",
          truckMemoNo: editEntry.truckMemoNo ?? "",
          truckMemoDate: editEntry.truckMemoDate ?? todayStr,
          ackNo: editEntry.ackNo ?? "",
          ackDate: editEntry.ackDate ?? "",
        }
      : {
          siteId: "",
          warehouseId: "",
          customerId: "",
          vehicleId: "",
          driverName: "",
          sampleNo: "",
          itemId: "",
          dispatchDate: todayStr,
          frkRequired: "no",
          truckMemoNo: "",
          truckMemoDate: todayStr,
          ackNo: "",
          ackDate: "",
        }
  )

  const [grossWeight, setGrossWeight] = useState(editEntry?.grossWeight ?? 0)
  const [tareWeight, setTareWeight] = useState(editEntry?.tareWeight ?? 0)
  const netWeight = Math.max(0, grossWeight - tareWeight)

  const [onbgBags, setOnbgBags] = useState(editEntry?.onbgBags ?? 0)
  const [unbgBags, setUnbgBags] = useState(editEntry?.unbgBags ?? 0)
  const [ssgBags, setSsgBags] = useState(editEntry?.ssgBags ?? 0)
  const [swpBags, setSwpBags] = useState(editEntry?.swpBags ?? 0)
  const totalBags = onbgBags + unbgBags + ssgBags + swpBags

  const filteredWarehouses = useMemo(() => {
    if (!formData.siteId) return warehouses
    return warehouses.filter((w) => Number(w.siteId) === Number(formData.siteId))
  }, [formData.siteId, warehouses])

  const [remarks, setRemarks] = useState(editEntry?.remarks ?? "")
  const [editingId, setEditingId] = useState<number | null>(editEntry?.id ?? null)
  const [showToast, setShowToast] = useState(false)
  const [viewEntry, setViewEntry] = useState<DispatchResponse | null>(null)

  useEffect(() => {
    if (viewEntry) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [viewEntry])

  useEffect(() => {
    if (editEntry) {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }, [])

  const totalPaddyDeducted = useMemo(() =>
    dispatches.reduce((s, d) => s + paddyEquivalent(d.itemId, d.netWeight || 0), 0),
    [dispatches, paddyEquivalent]
  )

  const adjustedPaddyDeposited = Math.max(0, totalPaddyDeposited - totalPaddyDeducted)

  const selectedItem = useMemo(() =>
    items.find((i) => String(i.id) === formData.itemId),
    [items, formData.itemId]
  )

  useEffect(() => {
    if (showToast) {
      const t = setTimeout(() => setShowToast(false), 4000)
      return () => clearTimeout(t)
    }
  }, [showToast])

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [name]: value }
      if (name === "siteId") next.warehouseId = ""
      if (name === "vehicleId") {
        const v = vehicles.find((v) => String(v.id) === value)
        next.driverName = String(v?.driverName ?? v?.name ?? "")
      }
      return next
    })
  }

  const canSave = grossWeight > 0 && formData.customerId

  const createMutation = useMutation({
    mutationFn: () =>
      createDispatch({
        siteId: Number(formData.siteId) || undefined,
        warehouseId: Number(formData.warehouseId) || undefined,
        customerId: Number(formData.customerId),
        vehicleId: Number(formData.vehicleId) || undefined,
        driverName: formData.driverName || undefined,
        sampleNo: formData.sampleNo || undefined,
        itemId: Number(formData.itemId) || undefined,
        dispatchDate: formData.dispatchDate || undefined,
        frkRequired: formData.frkRequired === "yes",
        truckMemoNo: formData.truckMemoNo || undefined,
        truckMemoDate: formData.truckMemoDate || undefined,
        ackNo: formData.ackNo || undefined,
        ackDate: formData.ackDate || undefined,
        grossWeight,
        tareWeight: tareWeight || undefined,
        onbgBags: onbgBags || undefined,
        unbgBags: unbgBags || undefined,
        ssgBags: ssgBags || undefined,
        swpBags: swpBags || undefined,
        remarks: remarks || undefined,
      }),
    onSuccess: () => {
      resetForm()
      queryClient.invalidateQueries({ queryKey: ["dispatches"] })
      setShowToast(true)
    },
  })

  const updateMutation = useMutation({
    mutationFn: () =>
      updateDispatch(editingId!, {
        siteId: Number(formData.siteId) || undefined,
        warehouseId: Number(formData.warehouseId) || undefined,
        customerId: Number(formData.customerId),
        vehicleId: Number(formData.vehicleId) || undefined,
        driverName: formData.driverName || undefined,
        sampleNo: formData.sampleNo || undefined,
        itemId: Number(formData.itemId) || undefined,
        dispatchDate: formData.dispatchDate || undefined,
        frkRequired: formData.frkRequired === "yes",
        truckMemoNo: formData.truckMemoNo || undefined,
        truckMemoDate: formData.truckMemoDate || undefined,
        ackNo: formData.ackNo || undefined,
        ackDate: formData.ackDate || undefined,
        grossWeight,
        tareWeight: tareWeight || undefined,
        onbgBags: onbgBags || undefined,
        unbgBags: unbgBags || undefined,
        ssgBags: ssgBags || undefined,
        swpBags: swpBags || undefined,
        remarks: remarks || undefined,
      }),
    onSuccess: () => {
      resetForm()
      queryClient.invalidateQueries({ queryKey: ["dispatches"] })
      setShowToast(true)
    },
  })

  const resetForm = () => {
    setEditingId(null)
    setFormData({ siteId: "", warehouseId: "", customerId: "", vehicleId: "", driverName: "", sampleNo: "", itemId: "", dispatchDate: todayStr, frkRequired: "no", truckMemoNo: "", truckMemoDate: todayStr, ackNo: "", ackDate: "" })
    setGrossWeight(0)
    setTareWeight(0)
    setOnbgBags(0)
    setUnbgBags(0)
    setSsgBags(0)
    setSwpBags(0)
    setRemarks("")
  }

  const handleEdit = (d: DispatchResponse) => {
    setEditingId(d.id)
    setFormData({
      siteId: String(d.siteId ?? ""),
      warehouseId: String(d.warehouseId ?? ""),
      customerId: String(d.customerId),
      vehicleId: String(d.vehicleId ?? ""),
      driverName: d.driverName ?? "",
      sampleNo: d.sampleNo ?? "",
      itemId: String(d.itemId ?? ""),
      dispatchDate: d.dispatchDate ?? "",
      frkRequired: d.frkRequired ? "yes" : "no",
      truckMemoNo: d.truckMemoNo ?? "",
      truckMemoDate: d.truckMemoDate ?? "",
      ackNo: d.ackNo ?? "",
      ackDate: d.ackDate ?? "",
    })
    setGrossWeight(d.grossWeight)
    setTareWeight(d.tareWeight ?? 0)
    setOnbgBags(d.onbgBags ?? 0)
    setUnbgBags(d.unbgBags ?? 0)
    setSsgBags(d.ssgBags ?? 0)
    setSwpBags(d.swpBags ?? 0)
    setRemarks(d.remarks ?? "")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const sidebarLinks = [
    { icon: "dashboard", label: "Dashboard", path: "/dashboard" },
    { icon: "database", label: "Masters", path: "/masters" },
    { icon: "precision_manufacturing", label: "Operations", path: "/operations", active: true },
    { icon: "inventory_2", label: "Inventory", path: "/inventory" },
    { icon: "account_balance", label: "Accounts", path: "/accounts" },
    { icon: "assessment", label: "Reports", path: "/reports" },
    { icon: "settings", label: "Settings", path: "/settings" },
  ]

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
              className={`flex items-center gap-md mx-2 px-4 py-3 rounded-full transition-all cursor-pointer ${item.active ? "bg-primary-container text-on-primary-container font-bold" : "text-on-surface-variant hover:bg-surface-container"}`}
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
      <main className="md:ml-64 pt-14 pb-32 min-h-screen">
        <div className="max-w-7xl mx-auto px-container-margin py-lg">
          <PageHeader
            title="Rice Deposit / Outward"
            breadcrumb={[
              { label: "Operations", path: "/operations" },
              { label: "Rice Mill ERP" },
            ]}
            actions={[
              <button key="history" className="flex items-center gap-xs px-md py-2 border border-outline-variant rounded-lg hover:bg-surface-container-high transition-all text-on-surface-variant font-label-md" onClick={() => navigate("/operations/outward-history")}>
                <span className="material-symbols-outlined text-md">history</span>
                View History
              </button>,
            ]}
          />

          {/* KPI Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter mb-lg">
            <div className="bg-surface-container-lowest border border-outline-variant p-md rounded flex flex-col gap-xs">
              <span className="text-on-surface-variant font-label-md text-label-md">Paddy Deposited (KG)</span>
              <span className="font-display-lg text-display-lg text-error industrial-numeric">{adjustedPaddyDeposited.toFixed(2)}</span>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant p-md rounded flex flex-col gap-xs">
              <span className="text-on-surface-variant font-label-md text-label-md">Rice Dispatched (KG)</span>
              <span className="font-display-lg text-display-lg text-on-surface industrial-numeric">{totalRiceDispatched.toFixed(2)}</span>
            </div>
            <div className="bg-primary text-on-primary p-md rounded flex flex-col gap-xs shadow-md">
              <span className="text-primary-fixed font-label-md text-label-md">Paddy Dispatch (KG)</span>
              <span className="font-display-lg text-display-lg industrial-numeric">{paddyEquivalent(Number(formData.itemId), netWeight).toFixed(2)}</span>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant p-md rounded flex flex-col gap-xs">
              <span className="text-on-surface-variant font-label-md text-label-md">Dispatched Qty (KG)</span>
              <span className="font-display-lg text-display-lg text-on-surface industrial-numeric">{dispatches.reduce((s, d) => s + (d.netWeight || 0), 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
            {/* Left Column */}
            <div className="lg:col-span-8 space-y-lg">
              {/* Dispatch Details */}
              <div className="bg-surface-container-lowest border border-outline-variant p-lg rounded-xl shadow-sm">
                <h3 className="font-title-md text-title-md mb-md flex items-center gap-xs text-primary">
                  <span className="material-symbols-outlined">local_shipping</span>
                  Dispatch Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  <div className="space-y-xs">
                    <label className="block font-label-md text-label-md text-on-surface-variant">Customer / Government Agency <span className="text-error">*</span></label>
                    <select className="w-full bg-white border border-outline rounded-lg p-md focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all appearance-none" value={formData.customerId} onChange={e => handleChange("customerId", e.target.value)}>
                      <option value="">Select Customer</option>
                      {customers.map((c) => (
                        <option key={String(c.id)} value={String(c.id)}>{String(c.name ?? "")}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-md">
                    <div className="space-y-xs">
                      <label className="block font-label-md text-label-md text-on-surface-variant">Sample Number</label>
                      <input className="w-full bg-white border border-outline rounded-lg p-md focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all" placeholder="SMPL-442" type="text" value={formData.sampleNo} onChange={e => handleChange("sampleNo", e.target.value)} />
                    </div>
                    <div className="space-y-xs">
                      <label className="block font-label-md text-label-md text-on-surface-variant">FRK <span className="text-error">*</span></label>
                      <select className="w-full bg-white border border-outline rounded-lg p-md focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all appearance-none" value={formData.frkRequired} onChange={e => handleChange("frkRequired", e.target.value)}>
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-md">
                    <div className="space-y-xs">
                      <label className="block font-label-md text-label-md text-on-surface-variant">Site <span className="text-error">*</span></label>
                      <select className="w-full bg-white border border-outline rounded-lg p-md focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all appearance-none" value={formData.siteId} onChange={e => handleChange("siteId", e.target.value)}>
                        <option value="">Select Site</option>
                        {sites.map((s) => (
                          <option key={String(s.id)} value={String(s.id)}>{String(s.siteName ?? s.name ?? "")}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-xs">
                      <label className="block font-label-md text-label-md text-on-surface-variant">Rice Item <span className="text-error">*</span></label>
                      <select className="w-full bg-white border border-outline rounded-lg p-md focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all appearance-none" value={formData.itemId} onChange={e => handleChange("itemId", e.target.value)}>
                        <option value="">Select Item</option>
                        {items.map((i) => (
                          <option key={String(i.id)} value={String(i.id)}>{String(i.itemName ?? "")}</option>
                        ))}
                      </select>
                      {selectedItem && (
                        <div className="flex gap-sm mt-1 text-[10px] text-on-surface-variant">
                          <span className="bg-surface-container-high px-2 py-0.5 rounded">{String(selectedItem.itemType ?? "—")}</span>
                          {String(selectedItem.itemType) === "FINISHED_GOOD" && (
                            <span className="bg-surface-container-high px-2 py-0.5 rounded">Outturn: {String(selectedItem.outturnPercent ?? selectedItem.outturn ?? "—")}%</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-md">
                    <div className="space-y-xs">
                      <label className="block font-label-md text-label-md text-on-surface-variant">Vehicle Number <span className="text-error">*</span></label>
                      <select className="w-full bg-white border border-outline rounded-lg p-md focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all appearance-none" value={formData.vehicleId} onChange={e => handleChange("vehicleId", e.target.value)}>
                        <option value="">Select Vehicle</option>
                        {vehicles.map((v) => (
                          <option key={String(v.id)} value={String(v.id)}>{String(v.vehicleNumber ?? "")} - {String(v.driverName ?? v.name ?? "")}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-xs">
                      <label className="block font-label-md text-label-md text-on-surface-variant">Driver <span className="text-error">*</span></label>
                      <input className="w-full bg-white border border-outline rounded-lg p-md focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all" placeholder="Driver name" type="text" value={formData.driverName} onChange={e => handleChange("driverName", e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-xs">
                    <label className="block font-label-md text-label-md text-on-surface-variant">Warehouse <span className="text-error">*</span></label>
                    <select className="w-full bg-white border border-outline rounded-lg p-md focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all appearance-none" value={formData.warehouseId} onChange={e => handleChange("warehouseId", e.target.value)}>
                      <option value="">Select Warehouse</option>
                      {filteredWarehouses.map((w) => (
                        <option key={String(w.id)} value={String(w.id)}>{String(w.warehouseName ?? w.name ?? "")}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-xs">
                    <label className="block font-label-md text-label-md text-on-surface-variant">Dispatch Date <span className="text-error">*</span></label>
                    <input className="w-full bg-white border border-outline rounded-lg p-md focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all" type="date" value={formData.dispatchDate} onChange={e => handleChange("dispatchDate", e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Government Reference */}
              <div className="bg-surface-container-lowest border border-outline-variant p-lg rounded-xl shadow-sm">
                <h3 className="font-title-md text-title-md mb-md flex items-center gap-xs text-primary">
                  <span className="material-symbols-outlined">description</span>
                  Government Reference
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  <div className="space-y-xs">
                    <label className="block font-label-md text-label-md text-on-surface-variant">Truck Memo Number <span className="text-error">*</span></label>
                    <input className="w-full bg-white border border-outline rounded-lg p-md focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all" placeholder="TM-2023/102" type="text" value={formData.truckMemoNo} onChange={e => handleChange("truckMemoNo", e.target.value)} />
                  </div>
                  <div className="space-y-xs">
                    <label className="block font-label-md text-label-md text-on-surface-variant">Truck Memo Date <span className="text-error">*</span></label>
                    <input className="w-full bg-white border border-outline rounded-lg p-md focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all" type="date" value={formData.truckMemoDate} onChange={e => handleChange("truckMemoDate", e.target.value)} />
                  </div>
                  <div className="space-y-xs">
                    <label className="block font-label-md text-label-md text-on-surface-variant">Acknowledgement No.</label>
                    <input className="w-full bg-white border border-outline rounded-lg p-md focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all" placeholder="ACK-992-00" type="text" value={formData.ackNo} onChange={e => handleChange("ackNo", e.target.value)} />
                  </div>
                  <div className="space-y-xs">
                    <label className="block font-label-md text-label-md text-on-surface-variant">Acknowledgement Date</label>
                    <input className="w-full bg-white border border-outline rounded-lg p-md focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all" type="date" value={formData.ackDate} onChange={e => handleChange("ackDate", e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-4 space-y-lg">
              {/* Live Weighment Data */}
              <div className="bg-inverse-surface text-white p-lg rounded-xl shadow-md">
                <h3 className="font-label-md text-label-md uppercase tracking-widest opacity-60 mb-md flex items-center gap-xs">
                  <span className="material-symbols-outlined text-sm">weight</span>
                  Live Weighment Data
                </h3>
                <div className="space-y-md">
                  <div className="flex justify-between items-center bg-white/5 p-md rounded-lg border border-white/10">
                    <span className="text-xs font-label-sm uppercase">Gross Weight</span>
                    <div className="flex items-baseline gap-xs">
                      <input
                        className="text-2xl font-bold bg-transparent text-white text-right w-28 border border-white/30 outline-none rounded px-2"
                        style={{ fontFamily: "'Courier New', monospace", letterSpacing: "-0.05em", colorScheme: "dark" }}
                        type="number"
                        step="0.001"
                        value={grossWeight || ""}
                        onChange={e => setGrossWeight(Number(e.target.value))}
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

              {/* Bag Configuration */}
              <div className="bg-surface-container-high border border-outline-variant p-lg rounded-xl">
                <h3 className="font-title-md text-title-md mb-md flex items-center gap-xs">
                  <span className="material-symbols-outlined text-primary">conveyor_belt</span>
                  Bag Configuration
                </h3>
                <div className="grid grid-cols-2 gap-sm mb-md">
                  {[
                    { label: "ONBG", value: onbgBags, setter: setOnbgBags },
                    { label: "UNBG", value: unbgBags, setter: setUnbgBags },
                    { label: "SSG", value: ssgBags, setter: setSsgBags },
                    { label: "SWP", value: swpBags, setter: setSwpBags },
                  ].map((bag) => (
                    <div key={bag.label} className="text-center">
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase mb-1">{bag.label}</p>
                      <input className="w-full bg-white border border-outline rounded p-sm text-center font-bold" type="number" value={bag.value} onChange={e => bag.setter(Math.max(0, Number(e.target.value)))} />
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
                    <span className="font-bold">{dispatches.reduce((s, d) => s + (d.onbgBags || 0) + (d.unbgBags || 0) + (d.ssgBags || 0) + (d.swpBags || 0), 0)}</span>
                  </div>
                  <div className="flex justify-between text-primary font-bold">
                    <span>Balance Bags Due</span>
                    <span>{Math.max(0, (customers.find(c => String(c.id) === formData.customerId)?.balanceBagsDue as number ?? 0) - totalBags)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div className="bg-surface-container-lowest border border-outline-variant p-lg rounded-xl shadow-sm mt-lg">
            <div className="space-y-xs">
              <label className="block font-label-md text-label-md text-on-surface-variant">Remarks / Internal Notes</label>
              <textarea className="w-full bg-white border border-outline rounded-lg p-md focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all min-h-[80px]" placeholder="Add dispatch remarks..." value={remarks} onChange={e => setRemarks(e.target.value)} />
            </div>
          </div>

          {/* Pending Dispatches */}
          <div className="mt-xl">
            <div className="flex justify-between items-center mb-md">
              <h3 className="font-title-md text-title-md">Today's Pending Dispatches</h3>
              <span className="text-xs text-on-surface-variant">{dispatches.length} entries</span>
            </div>
            <div className="bg-white border border-outline-variant rounded-xl overflow-x-auto shadow-sm">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-surface-container-high border-b border-outline-variant">
                    <th className="px-md py-3 text-[11px] font-bold uppercase text-on-surface-variant">Dispatch No</th>
                    <th className="px-md py-3 text-[11px] font-bold uppercase text-on-surface-variant">Customer</th>
                    <th className="px-md py-3 text-[11px] font-bold uppercase text-on-surface-variant">Vehicle</th>
                    <th className="px-md py-3 text-[11px] font-bold uppercase text-on-surface-variant text-right">Gross Wt</th>
                    <th className="px-md py-3 text-[11px] font-bold uppercase text-on-surface-variant text-right">Net Wt</th>
                    <th className="px-md py-3 text-[11px] font-bold uppercase text-on-surface-variant">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {dispatches.length === 0 ? (
                    <tr><td colSpan={6} className="px-md py-6 text-center text-on-surface-variant">No dispatches found</td></tr>
                  ) : (
                    dispatches.map((d) => (
                      <tr key={d.id} className="hover:bg-surface-container-low transition-colors text-sm">
                        <td className="px-md py-3 font-bold text-primary">{d.dispatchNo}</td>
                        <td className="px-md py-3">{d.customerName}</td>
                        <td className="px-md py-3 font-medium">{d.vehicleNumber ?? "—"}</td>
                        <td className="px-md py-3 text-right font-bold">{d.grossWeight.toFixed(2)}</td>
                        <td className="px-md py-3 text-right">{d.netWeight?.toFixed(2) ?? "—"}</td>
                        <td className="px-md py-3">
                          <div className="flex items-center gap-xs">
                            <button className="material-symbols-outlined text-md text-outline hover:text-primary" onClick={() => setViewEntry(d)}>visibility</button>
                            <button className="material-symbols-outlined text-md text-outline hover:text-primary" onClick={() => handleEdit(d)}>edit</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Footer */}
      <footer className="fixed bottom-0 left-0 md:left-64 right-0 z-50 bg-surface/80 border-t border-outline-variant p-md backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-md">
          <div className="hidden md:flex gap-sm">
            {editingId && (
              <button className="px-lg py-2 border border-outline text-on-surface-variant font-label-md rounded-lg hover:bg-surface-container transition-all" onClick={resetForm}>
                Cancel Edit
              </button>
            )}
          </div>
          <div className="flex gap-sm w-full md:w-auto">

            <button
              className="flex-[2] md:flex-none px-xl py-3 bg-primary text-on-primary font-bold rounded-lg flex items-center justify-center gap-md hover:opacity-90 transition-all shadow-md active:scale-95 disabled:opacity-50"
              onClick={() => editingId ? updateMutation.mutate() : createMutation.mutate()}
              disabled={!canSave || createMutation.isPending || updateMutation.isPending}
            >
              <span className="material-symbols-outlined">check_circle</span>
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingId ? "Update Dispatch" : "Complete Dispatch"}
            </button>
          </div>
        </div>
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

      {/* Success Toast */}
      <div className={`fixed top-20 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface px-lg py-md rounded-lg shadow-2xl flex items-center gap-md transition-all duration-500 z-[100] ${showToast ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10 pointer-events-none"}`}>
        <span className="material-symbols-outlined text-green-400">check_circle</span>
        <div className="text-sm">
          <p className="font-bold">{editingId ? "Dispatch Updated" : "Dispatch Completed"}</p>
        </div>
      </div>

      {/* View Dispatch Modal */}
      {viewEntry && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" onClick={() => setViewEntry(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-lg border-b border-outline-variant sticky top-0 bg-white">
              <div>
                <h3 className="font-headline-sm text-headline-sm">Dispatch Details</h3>
                <p className="text-sm text-on-surface-variant">{viewEntry.dispatchNo}</p>
              </div>
              <button className="p-1.5 hover:bg-surface-container-low rounded" onClick={() => setViewEntry(null)}>
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            <div className="p-lg space-y-md text-sm">
              <div className="grid grid-cols-2 gap-md">
                <DetailField label="Dispatch No" value={viewEntry.dispatchNo} />
                <DetailField label="Transaction No" value={viewEntry.transactionNo} />
                <DetailField label="Customer" value={viewEntry.customerName} />
                <DetailField label="Vehicle" value={viewEntry.vehicleNumber ?? "—"} />
                <DetailField label="Driver" value={viewEntry.driverName ?? "—"} />
                <DetailField label="Item" value={viewEntry.itemName ?? "—"} />
                <DetailField label="Site" value={viewEntry.siteName ?? "—"} />
                <DetailField label="Warehouse" value={viewEntry.warehouseName ?? "—"} />
                <DetailField label="Dispatch Date" value={viewEntry.dispatchDate ?? "—"} />
                <DetailField label="Sample No" value={viewEntry.sampleNo ?? "—"} />
                <DetailField label="FRK Required" value={viewEntry.frkRequired ? "Yes" : "No"} />
                <DetailField label="Truck Memo No" value={viewEntry.truckMemoNo ?? "—"} />
                <DetailField label="Truck Memo Date" value={viewEntry.truckMemoDate ?? "—"} />
                <DetailField label="Ack No" value={viewEntry.ackNo ?? "—"} />
                <DetailField label="Ack Date" value={viewEntry.ackDate ?? "—"} />
                <DetailField label="Gross Weight" value={`${viewEntry.grossWeight.toFixed(2)} kg`} />
                <DetailField label="Tare Weight" value={viewEntry.tareWeight != null ? `${viewEntry.tareWeight.toFixed(2)} kg` : "—"} />
                <DetailField label="Net Weight" value={viewEntry.netWeight != null ? `${viewEntry.netWeight.toFixed(2)} kg` : "—"} />
              </div>
              <div className="border-t border-outline-variant pt-md">
                <DetailField label="Remarks / Internal Notes" value={viewEntry.remarks ?? "—"} />
              </div>
              <div className="border-t border-outline-variant pt-md">
                <p className="font-label-md text-label-md text-on-surface-variant mb-sm">Bag Breakdown</p>
                <div className="grid grid-cols-4 gap-sm text-center">
                  <BagBadge label="ONBG" value={viewEntry.onbgBags ?? 0} />
                  <BagBadge label="UNBG" value={viewEntry.unbgBags ?? 0} />
                  <BagBadge label="SSG" value={viewEntry.ssgBags ?? 0} />
                  <BagBadge label="SWP" value={viewEntry.swpBags ?? 0} />
                </div>
              </div>
              <div className="border-t border-outline-variant pt-md grid grid-cols-2 gap-md text-[11px] text-on-surface-variant">
                <DetailField label="Created By" value={viewEntry.createdBy} />
                <DetailField label="Created At" value={viewEntry.createdAt ? new Date(viewEntry.createdAt).toLocaleString() : "—"} />
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

