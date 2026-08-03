import type { FilterField } from "../types"

type Props = {
  filters: FilterField[]
  values: Record<string, string>
  onChange: (name: string, value: string) => void
  lookups?: Record<string, { value: string; label: string }[]>
}

const baseInput =
  "w-full px-3 py-2 border-outline border rounded focus:border-primary focus:ring-1 focus:ring-primary-container outline-none transition-all font-body-md bg-surface-bright text-on-surface"

export default function FilterBar({ filters, values, onChange, lookups }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-md">
      {filters.map((filter) => {
        const currentVal = values[filter.name] ?? ""
        const resolvedOptions = lookups?.[filter.lookup ?? ""] ?? filter.options ?? []

        const renderInput = () => {
          switch (filter.type) {
            case "select":
              return (
                <div className="relative">
                  <select
                    className={`${baseInput} appearance-none pr-8`}
                    value={currentVal}
                    onChange={(e) => onChange(filter.name, e.target.value)}
                  >
                    <option value="">All {filter.label}</option>
                    {resolvedOptions.map((opt) => {
                      const val = typeof opt === "string" ? opt : opt.value
                      const lbl = typeof opt === "string" ? opt : opt.label
                      return (
                        <option key={val} value={val}>
                          {lbl}
                        </option>
                      )
                    })}
                  </select>
                  <span className="material-symbols-outlined absolute right-2 top-2 pointer-events-none text-on-surface-variant">
                    expand_more
                  </span>
                </div>
              )

            case "date":
              return (
                <input
                  className={baseInput}
                  type="date"
                  value={currentVal}
                  onChange={(e) => onChange(filter.name, e.target.value)}
                />
              )

            case "dateRange":
              return (
                <div className="flex items-center gap-2">
                  <input
                    className={baseInput}
                    type="date"
                    value={currentVal.split(",")[0] ?? ""}
                    onChange={(e) => onChange(filter.name, `${e.target.value},${currentVal.split(",")[1] ?? ""}`)}
                    placeholder="From"
                  />
                  <span className="text-on-surface-variant">to</span>
                  <input
                    className={baseInput}
                    type="date"
                    value={currentVal.split(",")[1] ?? ""}
                    onChange={(e) => onChange(filter.name, `${currentVal.split(",")[0] ?? ""},${e.target.value}`)}
                    placeholder="To"
                  />
                </div>
              )

            default:
              return (
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2 text-on-surface-variant">
                    search
                  </span>
                  <input
                    className={`${baseInput} pl-10`}
                    type="text"
                    placeholder={filter.label}
                    value={currentVal}
                    onChange={(e) => onChange(filter.name, e.target.value)}
                  />
                </div>
              )
          }
        }

        return (
          <div key={filter.name} className="flex flex-col gap-1">
            <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              {filter.label}
            </label>
            {renderInput()}
          </div>
        )
      })}
    </div>
  )
}
