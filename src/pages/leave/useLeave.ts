import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api, apiUrl } from "@/lib/api"
import type { LeaveApplication, LeaveSummaryItem } from "./types"

const BASE = "hr_client.api.leave"

function leaveUrl(method: string) {
  return apiUrl(`${BASE}.${method}`)
}

// ── Employee hooks ─────────────────────────────────────────────────────────

export function useMyLeaves() {
  return useQuery<{ success: boolean; data: LeaveApplication[] }>({
    queryKey: ["my_leaves"],
    queryFn: () => api.get(leaveUrl("get_my_leaves")).then((r) => r.data.message),
    staleTime: 1000 * 30,
  })
}

export function useApplyLeave() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      leave_type: string
      from_date: string
      to_date: string
      reason: string
    }) =>
      api
        .post(leaveUrl("apply_leave"), payload)
        .then((r) => r.data.message as { success: boolean; data?: LeaveApplication; error?: string }),
    onSuccess: (res) => {
      if (res.success) {
        qc.invalidateQueries({ queryKey: ["my_leaves"] })
        qc.invalidateQueries({ queryKey: ["all_leaves"] })
        qc.invalidateQueries({ queryKey: ["leave_summary"] })
      }
    },
  })
}

// ── Admin hooks ────────────────────────────────────────────────────────────

export function useAllLeaves(status = "All", employeeEmail?: string) {
  return useQuery<{ success: boolean; data: LeaveApplication[] }>({
    queryKey: ["all_leaves", status, employeeEmail],
    queryFn: () =>
      api
        .get(leaveUrl("get_all_leaves"), {
          params: { status, ...(employeeEmail ? { employee_email: employeeEmail } : {}) },
        })
        .then((r) => r.data.message),
    staleTime: 1000 * 30,
  })
}

export function useEmployeeLeaveHistory(employeeEmail: string) {
  return useQuery<{ success: boolean; employee: Record<string, string>; data: LeaveApplication[] }>({
    queryKey: ["employee_leave_history", employeeEmail],
    queryFn: () =>
      api
        .get(leaveUrl("get_employee_leave_history"), { params: { employee_email: employeeEmail } })
        .then((r) => r.data.message),
    staleTime: 1000 * 30,
    enabled: !!employeeEmail,
  })
}

export function useLeaveSummary() {
  return useQuery<{ success: boolean; data: LeaveSummaryItem[]; year: string }>({
    queryKey: ["leave_summary"],
    queryFn: () => api.get(leaveUrl("get_leave_summary")).then((r) => r.data.message),
    staleTime: 1000 * 60,
  })
}

export function useApproveLeave() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { leave_id: string; admin_remarks?: string }) =>
      api
        .post(leaveUrl("approve_leave"), payload)
        .then((r) => r.data.message as { success: boolean; error?: string }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all_leaves"] })
      qc.invalidateQueries({ queryKey: ["leave_summary"] })
      qc.invalidateQueries({ queryKey: ["employee_leave_history"] })
    },
  })
}

export function useRejectLeave() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { leave_id: string; admin_remarks: string }) =>
      api
        .post(leaveUrl("reject_leave"), payload)
        .then((r) => r.data.message as { success: boolean; error?: string }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all_leaves"] })
      qc.invalidateQueries({ queryKey: ["leave_summary"] })
      qc.invalidateQueries({ queryKey: ["employee_leave_history"] })
    },
  })
}
