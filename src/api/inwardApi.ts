import client from "./client"
import type { Page } from "./resource"

export type InwardResponse = {
  id: number
  voucherNo: string
  itemId: number | null
  itemName: string | null
  itemCode: string | null
  vendorId: number
  vendorName: string
  vehicleId: number
  vehicleNumber: string
  siteId: number
  siteName: string
  warehouseId: number
  warehouseName: string
  godownId: number | null
  godownName: string | null
  receiptRef: string | null
  inwardDate: string | null
  ackNo: string | null
  ackDate: string | null
  grossWeight: number
  tareWeight: number | null
  netWeight: number | null
  bagCount: number | null
  nbgBags: number | null
  ssgBags: number | null
  swpBags: number | null
  onbgBags: number | null
  unbgBags: number | null
  remarks: string | null
  grossWeightTime: string | null
  tareWeightTime: string | null
  createdBy: string
  createdAt: string
  status?: string
}

export type GrossWeightPayload = {
  vendorId: number
  itemId?: number
  vehicleId: number
  siteId: number
  warehouseId?: number
  godownId?: number
  receiptRef?: string
  inwardDate?: string
  ackNo?: string
  ackDate?: string
  grossWeight: number
  bagCount?: number
  nbgBags?: number
  ssgBags?: number
  swpBags?: number
  onbgBags?: number
  unbgBags?: number
  remarks?: string
}

export type TareWeightPayload = {
  tareWeight: number
}

export async function getAllInwards(params?: Record<string, unknown>): Promise<InwardResponse[]> {
  const { data } = await client.get<InwardResponse[]>("/inward", { params })
  return data
}

export async function getInwardsPage(params?: Record<string, unknown>): Promise<Page<InwardResponse>> {
  const { data } = await client.get<Page<InwardResponse>>("/inward/page", { params })
  return data
}

export async function getInwardById(id: number): Promise<InwardResponse> {
  const { data } = await client.get<InwardResponse>(`/inward/${id}`)
  return data
}

export async function createGrossWeight(payload: GrossWeightPayload): Promise<InwardResponse> {
  const { data } = await client.post<InwardResponse>("/inward/gross", payload)
  return data
}

export async function updateGrossWeight(id: number, payload: GrossWeightPayload): Promise<InwardResponse> {
  const { data } = await client.put<InwardResponse>(`/inward/${id}`, payload)
  return data
}

export async function captureTareWeight(id: number, payload: TareWeightPayload): Promise<InwardResponse> {
  const { data } = await client.put<InwardResponse>(`/inward/${id}/tare`, payload)
  return data
}

export async function getInwardStats(params?: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { data } = await client.get<Record<string, unknown>>("/inward/stats", { params })
  return data
}
