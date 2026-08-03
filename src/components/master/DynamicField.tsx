import type { FieldConfig } from "../../config/masterConfig"

type Props = {
  field: FieldConfig
  value: unknown
  onChange: (name: string, value: unknown) => void
  options?: { value: string; label: string }[]
  blink?: boolean
  blinkKey?: number
}

const baseInput =
  "w-full px-3 py-2 border-outline border rounded focus:border-primary focus:ring-1 focus:ring-primary-container outline-none transition-all font-body-md bg-surface-bright text-on-surface"

export default function DynamicField({ field, value, onChange, options, blink, blinkKey }: Props) {
  const { name, label, type, required, placeholder } = field

  const inputClass = `${baseInput}${blink ? " blink-required" : ""}`
  const inputKey = blink ? `blink-${blinkKey}` : undefined

  const render = () => {
    switch (type) {
      case "textarea":
        return (
          <textarea
            key={inputKey}
            className={`${inputClass} min-h-[80px]`}
            placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
            value={(value as string) || ""}
            onChange={(e) => onChange(name, e.target.value)}
          />
        )

      case "select":
        return (
          <select
            key={inputKey}
            className={`${inputClass} appearance-none`}
            value={(value as string) || field.defaultValue || ""}
            onChange={(e) => onChange(name, e.target.value)}
          >
            {!field.defaultValue && <option value="">Select {label}</option>}
            {(options || field.options || []).map((opt) => {
              const val = typeof opt === "string" ? opt : opt.value
              const lbl = typeof opt === "string" ? opt : opt.label
              return (
                <option key={val} value={val}>
                  {lbl}
                </option>
              )
            })}
          </select>
        )

      default:
        return (
          <input
            key={inputKey}
            className={inputClass}
            type={type === "password" ? "password" : type}
            placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
            value={(value as string) || ""}
            onChange={(e) => onChange(name, type === "number" ? Number(e.target.value) : e.target.value)}
          />
        )
    }
  }

  return (
    <div className="space-y-base">
      <label className="block font-label-md text-on-surface-variant">
        {label} {required && <span className="text-error">*</span>}
      </label>
      {render()}
    </div>
  )
}
