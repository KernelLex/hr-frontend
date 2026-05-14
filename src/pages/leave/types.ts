export const LEAVE_TYPES = [
  "Casual Leave",
  "Sick Leave",
  "Emergency Leave",
  "Maternity Leave",
  "Paternity Leave",
  "Unpaid Leave",
  "Work From Home",
  "Compensatory Leave",
] as const

export type LeaveType = (typeof LEAVE_TYPES)[number]
export type LeaveStatus = "Pending" | "Approved" | "Rejected"

export interface LeaveApplication {
  name: string
  employee: string
  employee_name: string
  leave_type: LeaveType
  from_date: string
  to_date: string
  total_days: number
  reason: string
  status: LeaveStatus
  admin_remarks?: string
  applied_on: string
  approved_by?: string
  approved_on?: string
  department?: string
  designation?: string
}

export interface LeaveSummaryItem {
  employee: string
  employee_name: string
  department: string
  designation: string
  total_days_taken: number
  pending: number
  approved: number
  rejected: number
  by_type: Record<string, number>
}
