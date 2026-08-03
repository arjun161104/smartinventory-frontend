import { useNavigate } from "react-router-dom"

type BreadcrumbItem = {
  label: string
  path?: string
}

type Props = {
  title: string
  subtitle?: string
  breadcrumb?: BreadcrumbItem[]
  actions?: React.ReactNode[]
}

export default function PageHeader({ title, subtitle, breadcrumb, actions }: Props) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-xl">
      <div>
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="flex items-center gap-1 font-body-sm text-body-sm text-on-surface-variant mb-1">
            {breadcrumb.map((item, idx) => (
              <span key={item.label} className="flex items-center gap-1">
                {idx > 0 && <span className="material-symbols-outlined text-sm">chevron_right</span>}
                {item.path ? (
                  <button
                    className="hover:text-primary transition-colors cursor-pointer"
                    onClick={() => navigate(item.path!)}
                  >
                    {item.label}
                  </button>
                ) : (
                  <span className="text-on-surface">{item.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h2 className="font-headline-md text-headline-md text-on-surface">{title}</h2>
        {subtitle && (
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">{subtitle}</p>
        )}
      </div>
      {actions && actions.length > 0 && (
        <div className="flex items-center gap-md shrink-0">
          {actions.map((action, idx) => (
            <span key={idx}>{action}</span>
          ))}
        </div>
      )}
    </div>
  )
}
