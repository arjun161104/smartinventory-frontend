import client from "./client"
import type { Page } from "./resource"

export type StockLedgerRecord = {
  id: number
  date: string
  itemId: number
  itemName: string
  itemCode: string
  godownId: number | null
  godownName: string | null
  transactionType: string
  referenceNo: string
  inwardQty: number
  outwardQty: number
  balanceQty: number
  uom: string
  remarks: string
}

export type StockLedgerSummary = {
  openingBalance: number
  totalInward: number
  totalOutward: number
  closingBalance: number
}

export type InventoryItem = {
  id: number
  name: string
  category: string
  currentStock: number
  uom: string
  minStock: number
  maxStock: number
  reorderLevel: number
  warehouse: string
  lastUpdated: string
}

export type StockMovement = {
  id: number
  date: string
  itemName: string
  type: "IN" | "OUT"
  quantity: number
  uom: string
  referenceNo: string
  remarks: string
}

export async function getStockLedgerPage(params?: Record<string, unknown>): Promise<Page<StockLedgerRecord>> {
  const { data } = await client.get<Page<StockLedgerRecord>>("/inventory/stock-ledger", { params })
  return data
}

export async function getStockLedgerSummary(params?: Record<string, unknown>): Promise<StockLedgerSummary> {
  const { data } = await client.get<StockLedgerSummary>("/inventory/stock-ledger/summary", { params })
  return data
}

export async function getInventoryItems(params?: Record<string, unknown>): Promise<InventoryItem[]> {
  const { data } = await client.get<InventoryItem[]>("/inventory/items", { params })
  return data
}

export async function getInventorySummary(): Promise<Record<string, unknown>> {
  const { data } = await client.get<Record<string, unknown>>("/inventory/summary")
  return data
}

export async function getStockMovements(params?: Record<string, unknown>): Promise<StockMovement[]> {
  const { data } = await client.get<StockMovement[]>("/inventory/movements", { params })
  return data
}
