import client from "./client"
import type { Page } from "./resource"

export type ProductionBatchRecord = {
  id: number
  batchNo: string
  itemId: number
  itemName: string
  itemCode: string
  plannedQuantity: number | null
  producedQuantity: number | null
  paddyConsumed: number | null
  godownId: number | null
  godownName: string | null
  status: string
  startDate: string | null
  endDate: string | null
  createdBy: string
  createdAt: string
}

export type ProductionYieldRecord = {
  id: number
  batchId: number
  batchNo: string
  itemId: number | null
  itemName: string | null
  quantity: number | null
  moisturePercentage: number | null
  wasteQuantity: number | null
  remarks: string | null
  createdAt: string
}

export type ProductionBatchCreate = {
  itemId: number
  plannedQuantity: number
  paddyConsumed?: number
  godownId?: number
  startDate?: string
}

export type ProductionYieldCreate = {
  batchId: number
  itemId?: number
  quantity: number
  moisturePercentage?: number
  wasteQuantity?: number
  remarks?: string
}

export type ProductionStats = {
  totalBatches: number
  activeBatches: number
  completedBatches: number
  totalYield: number
}

export async function getAllBatches(params?: Record<string, unknown>): Promise<Page<ProductionBatchRecord>> {
  const { data } = await client.get<Page<ProductionBatchRecord>>("/production/batches", { params })
  return data
}

export async function getBatchById(id: number): Promise<ProductionBatchRecord> {
  const { data } = await client.get<ProductionBatchRecord>(`/production/batches/${id}`)
  return data
}

export async function createBatch(payload: ProductionBatchCreate): Promise<ProductionBatchRecord> {
  const { data } = await client.post<ProductionBatchRecord>("/production/batches", payload)
  return data
}

export async function updateBatchStatus(id: number, status: string): Promise<ProductionBatchRecord> {
  const { data } = await client.put<ProductionBatchRecord>(`/production/batches/${id}/status`, { status })
  return data
}

export async function getYieldsByBatchId(batchId: number): Promise<ProductionYieldRecord[]> {
  const { data } = await client.get<ProductionYieldRecord[]>(`/production/batches/${batchId}/yields`)
  return data
}

export async function createYield(payload: ProductionYieldCreate): Promise<ProductionYieldRecord> {
  const { data } = await client.post<ProductionYieldRecord>("/production/yields", payload)
  return data
}

export async function getProductionStats(): Promise<ProductionStats> {
  const { data } = await client.get<ProductionStats>("/production/stats")
  return data
}
