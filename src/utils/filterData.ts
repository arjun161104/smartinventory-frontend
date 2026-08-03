import type { FilterField } from "../types"

export function filterData<T extends Record<string, unknown>>(
  data: T[],
  filters: Record<string, string>,
  filterFields: FilterField[],
): T[] {
  return data.filter((item) => {
    for (const field of filterFields) {
      const value = filters[field.name]
      if (!value || value === "") continue

      switch (field.type) {
        case "text": {
          const search = value.toLowerCase()
          const fields = field.searchFields ?? [field.name]
          const match = fields.some((f) => {
            const v = item[f]
            return v != null && String(v).toLowerCase().includes(search)
          })
          if (!match) return false
          break
        }
        case "date": {
          const dataField = field.field ?? field.name
          const itemDate = item[dataField]
          if (itemDate) {
            const itemDateStr = new Date(String(itemDate)).toISOString().split("T")[0]
            if (field.name === "dateFrom" && itemDateStr < value) return false
            if (field.name === "dateTo" && itemDateStr > value) return false
          }
          break
        }
        case "select": {
          const dataField = field.field ?? field.name
          const itemValue = item[dataField]
          if (itemValue != null && String(itemValue) !== value) return false
          break
        }
      }
    }
    return true
  })
}
