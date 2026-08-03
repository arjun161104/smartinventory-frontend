import { useState } from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { logout, getCurrentUser } from "../api/authApi"

const navItems = [
  { label: "Dashboard", icon: "dashboard", path: "/dashboard" },
  { label: "Masters", icon: "database", path: "/masters" },
  { label: "Operations", icon: "precision_manufacturing", path: "/operations" },
  { label: "Inventory", icon: "inventory_2", path: "/inventory" },
  { label: "Accounts", icon: "account_balance", path: "#" },
  { label: "Reports", icon: "assessment", path: "#" },
  { label: "Settings", icon: "settings", path: "#" },
]

export default function DashboardLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const currentUser = getCurrentUser()
  const initials = currentUser?.username?.slice(0, 2).toUpperCase() ?? "??"
  const roleLabel = currentUser?.roles?.[0]?.replace("ROLE_", "").charAt(0) + (currentUser?.roles?.[0]?.replace("ROLE_", "").slice(1).toLowerCase() ?? "")

  const isActive = (path: string) => {
    if (path === "#") return false
    if (path === "/dashboard") return location.pathname === "/dashboard"
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface font-body-md">
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 h-14 bg-surface border-b border-outline-variant md:hidden">
        <div className="flex items-center gap-4">
          <button
            className="material-symbols-outlined text-primary hover:bg-surface-container-high transition-colors p-2 rounded-full active:scale-95"
            onClick={() => setDrawerOpen(true)}
          >
            menu
          </button>
          <h1 className="font-headline-sm text-headline-sm font-bold text-primary">SmartInventory</h1>
        </div>
        <div className="flex items-center">
          <button className="material-symbols-outlined text-primary hover:bg-surface-container-high transition-colors p-2 rounded-full active:scale-95">
            notifications
          </button>
        </div>
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 bg-black/50 z-[55] md:hidden" onClick={() => setDrawerOpen(false)} />
      )}

      <aside
        className={`fixed left-0 top-0 bottom-0 z-[60] flex flex-col py-md bg-surface-container-lowest border-r border-outline-variant shadow-2xl h-full w-64 transition-transform duration-300 md:translate-x-0 ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="px-md mb-lg flex items-center justify-between">
          <div>
            <h1 className="font-headline-sm text-headline-sm font-bold text-primary">SmartInventory</h1>
            <p className="text-on-surface-variant font-label-md text-[10px] tracking-wider uppercase">Enterprise ERP</p>
          </div>
          <div className="md:hidden">
            <button className="material-symbols-outlined p-2 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant" onClick={() => setDrawerOpen(false)}>close</button>
          </div>
          <div className="hidden md:block">
            <button className="material-symbols-outlined p-2 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant">notifications</button>
          </div>
        </div>

        <div className="px-md mb-md pb-md border-b border-outline-variant">
          <div className="flex items-center gap-3 p-2 bg-surface-container-low rounded-xl">
            <div className="w-12 h-12 rounded-full border-2 border-primary bg-primary-container flex items-center justify-center text-on-primary-container font-bold uppercase">{initials}</div>
            <div className="flex-1 min-w-0">
              <p className="font-title-md text-on-surface truncate">{currentUser?.username ?? "User"}</p>
              <p className="text-label-sm text-on-surface-variant">{roleLabel}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto space-y-1 px-2">
          {navItems.map((item) => {
            const active = isActive(item.path)
            return (
              <div
                key={item.label}
                className={`flex items-center gap-3 cursor-pointer active:scale-95 transition-all px-3 py-3 rounded-lg ${
                  active
                    ? "bg-primary text-on-primary shadow-md"
                    : "text-on-surface-variant hover:bg-surface-container-high"
                }`}
                onClick={() => {
                  if (item.path !== "#") {
                    navigate(item.path)
                    setDrawerOpen(false)
                  }
                }}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="font-title-md">{item.label}</span>
              </div>
            )
          })}
        </nav>

        <div className="mt-auto px-md pb-md space-y-1 border-t border-outline-variant pt-4">
          <div className="text-on-surface-variant hover:bg-surface-container-high px-3 py-2 flex items-center gap-3 cursor-pointer rounded-lg transition-colors">
            <span className="material-symbols-outlined">help</span>
            <span className="font-label-md">Support Center</span>
          </div>
          <div className="text-error hover:bg-error-container px-3 py-2 flex items-center gap-3 cursor-pointer rounded-lg transition-colors" onClick={logout}>
            <span className="material-symbols-outlined">logout</span>
            <span className="font-label-md">Logout</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 pt-14 md:pt-0 md:pl-64">
        <Outlet />
      </main>
    </div>
  )
}
