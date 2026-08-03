import { useNavigate } from "react-router-dom"
import PageHeader from "../../components/PageHeader"

type WorkflowCard = {
  icon: string
  iconClass: string
  iconBg: string
  title: string
  description: string
  path: string
  badge?: { text: string; class: string }
  stats?: { label: string; value: string }
  prominent?: boolean
  progress?: { label: string; pct: number }[]
  span?: string
}

const workflowCards: WorkflowCard[] = [
  {
    icon: "input",
    iconClass: "text-primary text-3xl",
    iconBg: "bg-primary-container/10",
    title: "Inward (Receive Paddy)",
    description: "Register incoming raw materials, verify gate passes, and assign silo storage locations.",
    path: "/operations/inward",
    badge: { text: "24 PENDING", class: "bg-secondary-container text-on-secondary-container" },
    span: "lg:col-span-2",
    stats: { label: "TODAY", value: "124 MT" },
  },
  {
    icon: "output",
    iconClass: "text-tertiary",
    iconBg: "bg-tertiary-container/10",
    title: "Outward (Dispatch Rice)",
    description: "Manage dispatch schedules and carrier assignments.",
    path: "/operations/outward",
    badge: { text: "8 TODAY", class: "bg-surface-container-high text-on-surface-variant" },
  },
  // {
  //   icon: "high_quality",
  //   iconClass: "text-secondary",
  //   iconBg: "bg-secondary-container/10",
  //   title: "Quality Check",
  //   description: "Lab testing for moisture, grain length, and broken percentage.",
  //   path: "/quality-check",
  //   badge: { text: "3 WAITING", class: "bg-surface-container-high text-on-surface-variant" },
  // },
  {
    icon: "conveyor_belt",
    iconClass: "text-white text-3xl",
    iconBg: "bg-white/20",
    title: "Production Control",
    description: "Real-time milling efficiency and machine output tracking.",
    path: "/production/batch",
    prominent: true,
    span: "lg:row-span-2",
    progress: [
      { label: "Mill A Efficiency", pct: 94 },
      { label: "Silo B Capacity", pct: 62 },
    ],
  },
  {
    icon: "menu_book",
    iconClass: "text-outline",
    iconBg: "bg-surface-container-highest",
    title: "Registers",
    description: "Access gate registers, moisture logs, and weighbridge slips.",
    badge: { text: "Coming Soon", class: "bg-amber-50 text-amber-800" },
    path: "#",
  },
  {
    icon: "sync_alt",
    iconClass: "text-on-surface-variant",
    iconBg: "bg-surface-container-highest",
    title: "Transfers",
    description: "Internal stock movement between godowns and silos.",
    path: "/operations/transfers",
  },
]

export default function OperationsHub() {
  const navigate = useNavigate()

  return (
    <div className="max-w-7xl mx-auto px-container-margin py-8 grid grid-rows-[auto_1fr] h-[calc(100dvh-3.5rem)] md:h-dvh overflow-hidden">
      <PageHeader
        title="Operations Hub"
        subtitle="Manage daily workflows and industrial processing modules."
        actions={[
          <div
            key="date"
            className="flex items-center gap-2 bg-surface-container-high px-4 py-2 rounded-lg border border-outline-variant"
          >
            <span className="material-symbols-outlined text-primary text-[18px]">calendar_today</span>
            <span className="font-label-md text-label-md text-on-surface-variant">
              {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase()}
            </span>
          </div>,
          <button
            key="new-task"
            className="bg-primary hover:opacity-90 text-white font-label-md text-label-md py-2 px-4 rounded transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            NEW TASK
          </button>,
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md auto-rows-fr overflow-y-auto">
        {workflowCards.map((card) => {
          if (card.prominent) {
            return (
              <button
                key={card.title}
                onClick={() => navigate(card.path)}
                className={`${card.span ?? ""} relative overflow-hidden bg-primary-container text-on-primary-container border border-primary rounded-xl p-6 flex flex-col text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg group`}
              >
                <div className="relative z-10 flex flex-col h-full">
                  <div className={`w-12 h-12 rounded-lg ${card.iconBg} flex items-center justify-center mb-4`}>
                    <span className={`material-symbols-outlined ${card.iconClass}`}>{card.icon}</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-white font-bold">{card.title}</h3>
                  <p className="text-white/80 font-body-md text-body-md mt-2">{card.description}</p>
                  <div className="mt-auto space-y-3 pt-6">
                    {card.progress?.map((p) => (
                      <div key={p.label} className="bg-white/10 rounded-lg p-3 border border-white/20">
                        <div className="flex justify-between text-label-sm font-label-sm mb-1 uppercase tracking-wider">
                          <span>{p.label}</span>
                          <span>{p.pct}%</span>
                        </div>
                        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-white h-full rounded-full" style={{ width: `${p.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <span className="bg-white text-primary font-label-md text-label-md px-4 py-2 rounded-lg font-bold shadow-sm inline-block">
                      CONTROL PANEL
                    </span>
                  </div>
                </div>
                <div className="absolute right-[-20px] bottom-[-20px] opacity-10 rotate-12">
                  <span className="material-symbols-outlined text-[180px]">factory</span>
                </div>
              </button>
            )
          }

          return (
            <button
              key={card.title}
              onClick={() => navigate(card.path)}
              className="bg-white border border-outline-variant rounded-xl p-6 flex flex-col text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-primary group"
            >
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-lg ${card.iconBg} flex items-center justify-center shrink-0`}>
                  <span className={`material-symbols-outlined ${card.iconClass}`}>{card.icon}</span>
                </div>
                {card.badge && (
                  <span className={`font-label-sm text-label-sm px-2 py-1 rounded ${card.badge.class}`}>
                    {card.badge.text}
                  </span>
                )}
              </div>

              <h3 className="font-title-md text-title-md text-on-surface font-bold mt-4 group-hover:text-primary transition-colors">
                {card.title}
              </h3>
              <p className="text-on-surface-variant font-body-sm text-body-sm mt-1 leading-relaxed">
                {card.description}
              </p>

              <div className="mt-auto pt-6 flex items-center justify-between">
                {card.stats ? (
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">{card.stats.label}: {card.stats.value}</span>
                ) : (
                  <span />
                )}
                <span className="material-symbols-outlined text-primary group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </div>
            </button>
          )
        })}
      </div>


    </div>
  )
}
