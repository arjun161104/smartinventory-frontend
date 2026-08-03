import { useLocation, useNavigate } from "react-router-dom"

const tabs = [
  { label: "Dashboard", icon: "dashboard", path: "/dashboard" },
  { label: "Operations", icon: "conveyor_belt", path: "/operations/inward-history" },
  { label: "Inventory", icon: "warehouse", path: "/items" },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="fixed bottom-0 left-0 w-full z-40 flex justify-around items-center px-4 pb-1 h-16 bg-surface border-t border-outline-variant md:hidden">
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center justify-center px-4 py-1 transition-colors ${
              isActive
                ? "bg-secondary-container text-on-secondary-container rounded-full scale-90"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined">{tab.icon}</span>
            <span className="font-label-sm text-label-sm">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
