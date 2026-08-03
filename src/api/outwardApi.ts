import client from "./client"

export type DispatchResponse = {
  id: number
  dispatchNo: string
  transactionNo: string
  siteId: number | null
  siteName: string | null
  warehouseId: number | null
  warehouseName: string | null
  customerId: number
  customerName: string
  vehicleId: number | null
  vehicleNumber: string | null
  driverName: string | null
  sampleNo: string | null
  itemId: number | null
  itemName: string | null
  itemCode: string | null
  dispatchDate: string | null
  frkRequired: boolean | null
  truckMemoNo: string | null
  truckMemoDate: string | null
  ackNo: string | null
  ackDate: string | null
  grossWeight: number
  tareWeight: number | null
  netWeight: number | null
  onbgBags: number | null
  unbgBags: number | null
  ssgBags: number | null
  swpBags: number | null
  remarks: string | null
  createdBy: string
  createdAt: string
}

export type DispatchPayload = {
  siteId?: number
  warehouseId?: number
  customerId: number
  vehicleId?: number
  driverName?: string
  sampleNo?: string
  itemId?: number
  dispatchDate?: string
  frkRequired?: boolean
  truckMemoNo?: string
  truckMemoDate?: string
  ackNo?: string
  ackDate?: string
  grossWeight: number
  tareWeight?: number
  onbgBags?: number
  unbgBags?: number
  ssgBags?: number
  swpBags?: number
  remarks?: string
}

export async function getAllDispatches(): Promise<DispatchResponse[]> {
  const { data } = await client.get<DispatchResponse[]>("/dispatch")
  return data
}

export async function getDispatchById(id: number): Promise<DispatchResponse> {
  const { data } = await client.get<DispatchResponse>(`/dispatch/${id}`)
  return data
}

export async function createDispatch(payload: DispatchPayload): Promise<DispatchResponse> {
  const { data } = await client.post<DispatchResponse>("/dispatch", payload)
  return data
}

export async function updateDispatch(id: number, payload: DispatchPayload): Promise<DispatchResponse> {
  const { data } = await client.put<DispatchResponse>(`/dispatch/${id}`, payload)
  return data
}
