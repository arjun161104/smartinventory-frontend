import client from "./client"
import type { Page } from "./resource"

export type QualityCheckRecord = {
  id: number
  weighmentId: number
  weighmentNo: string
  moisture: number
  brokenPct: number
  discolored: number
  foreignMatter: number
  smell: string
  remarks: string
  status: string
  checkedBy: string
  checkedAt: string
  approvedBy: string | null
  approvedAt: string | null
}

export type QualityCheckCreate = {
  weighmentId: number
  moisture: number
  brokenPct: number
  discolored: number
  foreignMatter: number
  smell: string
  remarks?: string
  checkedBy: string
}

export type QualityCheckApprove = {
  status: "APPROVED" | "REJECTED"
  approvedBy: string
  remarks?: string
}

export async function getAllQualityChecks(params?: Record<string, unknown>): Promise<QualityCheckRecord[]> {
  const { data } = await client.get<QualityCheckRecord[]>("/quality-checks", { params })
  return data
}

export async function getQualityChecksPage(params?: Record<string, unknown>): Promise<Page<QualityCheckRecord>> {
  const { data } = await client.get<Page<QualityCheckRecord>>("/quality-checks/page", { params })
  return data
}

export async function getQualityCheckById(id: number): Promise<QualityCheckRecord> {
  const { data } = await client.get<QualityCheckRecord>(`/quality-checks/${id}`)
  return data
}

export async function createQualityCheck(payload: QualityCheckCreate): Promise<QualityCheckRecord> {
  const { data } = await client.post<QualityCheckRecord>("/quality-checks", payload)
  return data
}

export async function approveQualityCheck(id: number, payload: QualityCheckApprove): Promise<QualityCheckRecord> {
  const { data } = await client.put<QualityCheckRecord>(`/quality-checks/${id}/approve`, payload)
  return data
}
