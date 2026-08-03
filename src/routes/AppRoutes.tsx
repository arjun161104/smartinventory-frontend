import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom"
import { useEffect } from "react"
import DashboardLayout from "../layouts/DashboardLayout"
import Login from "../pages/Login"
import Dashboard from "../pages/Dashboard"
import Masters from "../pages/Masters"
import InventoryDashboard from "../pages/inventory/InventoryDashboard"
import StockLedger from "../pages/inventory/StockLedger"
import ProductionYield from "../pages/production/ProductionYield"
import ProductionBatch from "../pages/production/ProductionBatch"
// import QualityCheck from "../pages/quality/QualityCheck"
import OperationsHub from "../pages/operations/OperationsHub"
import InwardEntry from "../pages/operations/InwardEntry"
import InwardHistory from "../pages/operations/InwardHistory"
import OutwardEntry from "../pages/operations/OutwardEntry"
import OutwardHistory from "../pages/operations/OutwardHistory"
import ProtectedRoute from "../components/ProtectedRoute"
import GuestRoute from "../components/GuestRoute"
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/operations/inward" element={<InwardEntry />} />
          <Route path="/operations/outward" element={<OutwardEntry />} />
          <Route path="/operations/outward-history" element={<OutwardHistory />} />
          <Route path="/operations/inward-history" element={<InwardHistory />} />
          <Route element={<DashboardLayout />}>
          <Route path="/operations" element={<OperationsHub />} />
          <Route path="/dashboard" element={<Dashboard />} />
          {/* <Route path="/quality-check" element={<QualityCheck />} /> */}
          <Route path="/masters" element={<Masters />} />
          <Route path="/inventory" element={<InventoryDashboard />} />
          <Route path="/inventory/stockledger" element={<StockLedger />} />
          <Route path="/production/yield" element={<ProductionYield />} />
          <Route path="/production/batch" element={<ProductionBatch />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
