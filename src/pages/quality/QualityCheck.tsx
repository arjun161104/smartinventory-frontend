import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import DynamicForm from "../../components/DynamicForm"
import { QC_PARAMETER_FIELDS } from "../../config/qcConfig"
import { getAllInwards } from "../../api/inwardApi"
import { createQualityCheck } from "../../api/qualityApi"

export default function QualityCheck() {
  const queryClient = useQueryClient()
  const [showSuccess, setShowSuccess] = useState(false)
  const [selectedWeighmentId, setSelectedWeighmentId] = useState("")
  const [formData, setFormData] = useState<Record<string, unknown>>({ grade: "A" })

  const { data: weighments = [] } = useQuery({
    queryKey: ["inwards"],
    queryFn: () => getAllInwards(),
  })

  const createMutation = useMutation({
    mutationFn: () =>
      createQualityCheck({
        weighmentId: Number(selectedWeighmentId),
        moisture: Number(formData.moisture) || 0,
        brokenPct: Number(formData.broken) || 0,
        discolored: Number(formData.discolored) || 0,
        foreignMatter: Number(formData.foreignMatter) || 0,
        smell: (formData.smell as string) || "",
        remarks: (formData.remarks as string) || "",
        checkedBy: "currentUser",
      }),
    onSuccess: () => {
      setShowSuccess(true)
      queryClient.invalidateQueries({ queryKey: ["quality-checks"] })
    },
  })

  const handleChange = (name: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleApprove = () => {
    if (!selectedWeighmentId) return
    createMutation.mutate()
  }

  const handleReject = () => {
    alert("Consignment marked for Rejection. Please specify reasons in Remarks.")
  }

  const pendingWeighments = weighments

  return (
    <div className="px-4 py-6 pb-24">
      <div className="mb-6">
        <h2 className="font-headline-sm text-headline-sm text-on-surface mb-1">Quality Check</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">Perform quality inspection for incoming paddy/rice consignments.</p>
      </div>

      <div className="mb-4">
        <label className="font-label-md text-label-md text-on-surface-variant mb-1 block">Voucher Search/Select</label>
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
          <select
            className="w-full pl-10 pr-4 py-2 bg-surface border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary appearance-none font-body-md text-body-md transition-all"
            value={selectedWeighmentId}
            onChange={(e) => setSelectedWeighmentId(e.target.value)}
          >
            <option value="">Select Consignment Voucher...</option>
            {pendingWeighments.map((w) => (
              <option key={w.id} value={w.id}>
                {w.voucherNo} ({w.vendorName})
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
        </div>
        {pendingWeighments.length === 0 && (
          <p className="text-body-sm text-on-surface-variant mt-1">No pending QC weighments available</p>
        )}
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 mb-4 shadow-sm">
        <h3 className="font-label-md text-label-md text-primary uppercase tracking-wider mb-4 border-b border-outline-variant pb-1">Parameters</h3>
        <DynamicForm fields={QC_PARAMETER_FIELDS} data={formData} onChange={handleChange} />
      </div>

      <div className="relative h-32 w-full rounded-xl overflow-hidden mb-6">
        <div
          className="w-full h-full bg-cover bg-center"
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB5b9vfi4rvg7UWtxMvzqJyYIYt0PgQLbwm_GwTZ8dfvXG0EjLgXY6fbFWWJIS5dCYHA6ATos-S2st1ZtTfxG_wa2tTjer6fEgBSEyyAUSMhT5A9aaqnAtqLVcFYZ5ZFNpoJTWGdnf6det4l3VIuOlOCTeYEScmQ9zTreSVQVls4sk3JVesbb1SximKaleRsVlYAbyxy9CicfFlI51p3tdyd12i3s-OaoBCkWnvPlwx1heA1zmXmARdam_HEX7NFS_AvKkzJnoWdus')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4">
          <span className="text-white font-label-md flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">visibility</span>
            Live Visual Analysis Enabled
          </span>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-outline-variant h-16 flex items-center px-4 gap-4">
        <button
          className="flex-1 bg-[#DC2626] text-white font-label-md py-3 rounded active:scale-95 transition-transform flex items-center justify-center gap-1 disabled:opacity-50"
          onClick={handleReject}
          disabled={!selectedWeighmentId || createMutation.isPending}
        >
          <span className="material-symbols-outlined">close</span>
          Reject
        </button>
        <button
          className="flex-1 bg-[#16A34A] text-white font-label-md py-3 rounded active:scale-95 transition-transform flex items-center justify-center gap-1 disabled:opacity-50"
          onClick={handleApprove}
          disabled={!selectedWeighmentId || createMutation.isPending}
        >
          <span className="material-symbols-outlined">{createMutation.isPending ? "progress_activity" : "check"}</span>
          {createMutation.isPending ? "Saving..." : "Approve"}
        </button>
      </div>

      {createMutation.isError && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-8">
          <div className="bg-surface rounded-xl p-8 max-w-[320px] w-full text-center">
            <div className="w-16 h-16 bg-error-container text-error rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[40px]">error</span>
            </div>
            <h3 className="font-headline-sm text-headline-sm mb-1">Submission Failed</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-6">
              {createMutation.error instanceof Error ? createMutation.error.message : "An error occurred"}
            </p>
            <button className="w-full bg-primary text-on-primary py-3 rounded-full font-label-md active:scale-95 transition-all" onClick={() => createMutation.reset()}>Dismiss</button>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-8">
          <div className="bg-surface rounded-xl p-8 max-w-[320px] w-full text-center">
            <div className="w-16 h-16 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[40px]">check_circle</span>
            </div>
            <h3 className="font-headline-sm text-headline-sm mb-1">Quality Updated</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-6">Consignment has been successfully approved and moved to silo storage.</p>
            <button className="w-full bg-primary text-on-primary py-3 rounded-full font-label-md active:scale-95 transition-all" onClick={() => setShowSuccess(false)}>Continue</button>
          </div>
        </div>
      )}
    </div>
  )
}
