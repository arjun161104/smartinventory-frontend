import { useState, useCallback } from "react"

type ValidationRule<T> = {
  required?: boolean
  min?: number
  max?: number
  pattern?: RegExp
  message?: string
  validate?: (value: T[keyof T], values: T) => string | null
}

type ValidationRules<T> = Partial<Record<keyof T, ValidationRule<T>>>

type Errors<T> = Partial<Record<keyof T, string>>

type UseFormResult<T extends Record<string, unknown>> = {
  values: T
  errors: Errors<T>
  touched: Partial<Record<keyof T, boolean>>
  handleChange: (name: keyof T, value: T[keyof T]) => void
  handleBlur: (name: keyof T) => void
  handleSubmit: (onSubmit: (values: T) => void | Promise<void>) => (e: React.FormEvent) => void
  reset: (newValues?: T) => void
  setValues: (updater: Partial<T> | ((prev: T) => T)) => void
  isValid: boolean
}

export function useForm<T extends Record<string, unknown>>(
  initialValues: T,
  rules?: ValidationRules<T>,
): UseFormResult<T> {
  const [values, setValuesState] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Errors<T>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})

  const validateField = useCallback(
    (name: keyof T, value: T[keyof T]): string | null => {
      const rule = rules?.[name]
      if (!rule) return null

      if (rule.required && (value === "" || value === null || value === undefined)) {
        return rule.message || `${String(name)} is required`
      }

      if (typeof value === "number") {
        if (rule.min !== undefined && value < rule.min) {
          return rule.message || `Minimum value is ${rule.min}`
        }
        if (rule.max !== undefined && value > rule.max) {
          return rule.message || `Maximum value is ${rule.max}`
        }
      }

      if (typeof value === "string" && rule.pattern && !rule.pattern.test(value)) {
        return rule.message || `Invalid format`
      }

      if (rule.validate) {
        return rule.validate(value, values)
      }

      return null
    },
    [rules, values],
  )

  const handleChange = useCallback(
    (name: keyof T, value: T[keyof T]) => {
      setValuesState((prev) => ({ ...prev, [name]: value }))
      if (touched[name]) {
        const error = validateField(name, value)
        setErrors((prev) => ({ ...prev, [name]: error }))
      }
    },
    [touched, validateField],
  )

  const handleBlur = useCallback(
    (name: keyof T) => {
      setTouched((prev) => ({ ...prev, [name]: true }))
      const error = validateField(name, values[name])
      setErrors((prev) => ({ ...prev, [name]: error }))
    },
    [values, validateField],
  )

  const handleSubmit = useCallback(
    (onSubmit: (values: T) => void | Promise<void>) => {
      return async (e: React.FormEvent) => {
        e.preventDefault()
        const allTouched = Object.keys(values).reduce(
          (acc, key) => ({ ...acc, [key]: true }),
          {} as Partial<Record<keyof T, boolean>>,
        )
        setTouched(allTouched)

        const newErrors: Errors<T> = {}
        for (const key of Object.keys(values) as (keyof T)[]) {
          const error = validateField(key, values[key])
          if (error) newErrors[key] = error
        }
        setErrors(newErrors)

        if (Object.keys(newErrors).length === 0) {
          await onSubmit(values)
        }
      }
    },
    [values, validateField],
  )

  const reset = useCallback((newValues?: T) => {
    setValuesState(newValues ?? initialValues)
    setErrors({})
    setTouched({})
  }, [initialValues])

  const setValues = useCallback((updater: Partial<T> | ((prev: T) => T)) => {
    setValuesState((prev) => (typeof updater === "function" ? updater(prev) : { ...prev, ...updater }))
  }, [])

  const isValid = Object.keys(errors).length === 0

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setValues,
    isValid,
  }
}
