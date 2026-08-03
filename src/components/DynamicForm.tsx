import type { ReactNode } from "react"
import type { WorkflowField } from "../types"

type Props = {
  fields: WorkflowField[]
  data: Record<string, unknown>
  onChange: (name: string, value: unknown) => void
  lookups?: Record<string, { value: string; label: string }[]>
  groupSections?: boolean
  sectionExtra?: Record<string, ReactNode>
}

const baseInput =
  "w-full px-3 py-2 border-outline border rounded focus:border-primary focus:ring-1 focus:ring-primary-container outline-none transition-all font-body-md bg-surface-bright text-on-surface"

function resolveOptions(field: WorkflowField, lookups?: Record<string, { value: string; label: string }[]>) {
  if (field.lookup && lookups?.[field.lookup]) return lookups[field.lookup]
  if (field.options) return field.options
  return []
}

export default function DynamicForm({ fields, data, onChange, lookups, groupSections, sectionExtra }: Props) {
  const grouped = groupSections
    ? fields.reduce<Record<string, WorkflowField[]>>((acc, f) => {
        const section = f.section ?? "_default"
        if (!acc[section]) acc[section] = []
        acc[section].push(f)
        return acc
      }, {})
    : { _default: fields }

  const renderField = (field: WorkflowField) => {
    const value = data[field.name]
    const { name, label, type, required, placeholder } = field

    const spanClass = field.span === "full" ? "col-span-full" : ""

    switch (type) {
      case "textarea":
        return (
          <div key={name} className={`space-y-1 ${spanClass}`}>
            <label className="block font-label-md text-label-md text-on-surface-variant">
              {label} {required && <span className="text-error">*</span>}
            </label>
            <textarea
              className={`${baseInput} min-h-[80px]`}
              placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
              value={(value as string) || ""}
              onChange={(e) => onChange(name, e.target.value)}
              onFocus={e => e.target.select()}
            />
          </div>
        )

      case "select": {
        const options = resolveOptions(field, lookups)
        return (
          <div key={name} className={`space-y-1 ${spanClass}`}>
            <label className="block font-label-md text-label-md text-on-surface-variant">
              {label} {required && <span className="text-error">*</span>}
            </label>
            <div className="relative">
              <select
                className={`${baseInput} appearance-none pr-8`}
                value={(value as string) || ""}
                onChange={(e) => onChange(name, e.target.value)}
              >
                <option value="">Select {label}</option>
                {options.map((opt) => {
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
          </div>
        )
      }

      default:
        return (
          <div key={name} className={`space-y-1 ${spanClass}`}>
            <label className="block font-label-md text-label-md text-on-surface-variant">
              {label} {required && <span className="text-error">*</span>}
            </label>
            <input
              className={baseInput}
              type={type === "password" ? "password" : type}
              placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
              value={(value as string) || ""}
              onChange={(e) => onChange(name, type === "number" ? Number(e.target.value) : e.target.value)}
              onFocus={e => e.target.select()}
            />
          </div>
        )
    }
  }

  if (!groupSections) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
        {fields.map(renderField)}
      </div>
    )
  }

  return (
    <div className="space-y-lg">
      {Object.entries(grouped).map(([section, sectionFields]) => {
        if (section === "_default") {
          return (
            <div key={section} className="grid grid-cols-1 md:grid-cols-2 gap-md">
              {sectionFields.map(renderField)}
            </div>
          )
        }

        const sectionLabel = section.charAt(0).toUpperCase() + section.slice(1)

        return (
          <section key={section} className="bg-white border border-outline-variant rounded p-lg">
            <div className="flex items-center gap-2 mb-md border-b border-outline-variant pb-2">
              <span className="material-symbols-outlined text-primary">
                {section === "logistics" ? "local_shipping" : section === "location" ? "location_on" : "scale"}
              </span>
              <h3 className="font-title-md text-title-md text-primary">{sectionLabel}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              {sectionFields.map(renderField)}
            </div>
            {sectionExtra?.[section] && (
              <div className="mt-md border-t border-outline-variant pt-md">
                {sectionExtra[section]}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
