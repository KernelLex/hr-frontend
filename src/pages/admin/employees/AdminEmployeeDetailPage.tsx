import { useState, useRef } from "react"
import { useParams, useNavigate, Navigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft, Camera, Pencil, Check, X, Lock, CalendarDays, Clock,
} from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useAuth } from "@/context/AuthContext"
import {
  getEmployeeProfile, adminUpdateProfile, uploadProfilePhoto,
  type EmployeeProfile,
} from "@/api/employee"
import { useEmployeeLeaveHistory, useApproveLeave, useRejectLeave } from "@/pages/leave/useLeave"
import { useUsersWithPermissions, useUpdatePermissions } from "@/pages/admin/permissions/usePermissions"
import {
  PERMISSION_MODULE_LABELS, MODULE_ICONS,
  type PermissionModule,
} from "@/pages/admin/permissions/types"

const ADMIN_USERS = new Set(["Administrator", "owais@veraenterprises.in"])

const ALL_MODULES: PermissionModule[] = [
  "recruitment", "employee_lifecycle", "accounts", "projects",
  "logistics", "hr", "attendance", "expense",
]

const BLOOD_GROUPS = ["", "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
}
function departmentLabel(dept: string) {
  return dept.replace(/ - V$/, "")
}

function statusBadge(status: string) {
  if (status === "Approved") return <Badge className="bg-emerald-50 text-emerald-700 border-0 text-xs">Approved</Badge>
  if (status === "Rejected") return <Badge className="bg-red-50 text-red-700 border-0 text-xs">Rejected</Badge>
  return <Badge className="bg-amber-50 text-amber-700 border-0 text-xs">Pending</Badge>
}

// ── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileField({
  label, value, field, editMode, draft, onChange, type = "text", as, options,
}: {
  label: string; value: string; field: keyof EmployeeProfile; editMode: boolean
  draft: Partial<EmployeeProfile>; onChange: (f: keyof EmployeeProfile, v: string) => void
  type?: string; as?: "select"; options?: string[]
}) {
  const current = (draft[field] as string) ?? value
  if (!editMode) {
    return (
      <div className="space-y-0.5">
        <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm text-gray-800">{current || <span className="text-gray-400 italic">Not set</span>}</p>
      </div>
    )
  }
  if (as === "select" && options) {
    return (
      <div className="space-y-0.5">
        <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <select
          className="w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={current}
          onChange={(e) => onChange(field, e.target.value)}
        >
          {options.map((o) => <option key={o} value={o}>{o || "—"}</option>)}
        </select>
      </div>
    )
  }
  return (
    <div className="space-y-0.5">
      <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">{label}</p>
      <Input type={type} value={current} onChange={(e) => onChange(field, e.target.value)} className="h-8 text-sm" />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="bg-white shadow-sm border-0 ring-1 ring-gray-100">
      <CardHeader className="pb-3 pt-4 px-5">
        <CardTitle className="text-sm font-semibold text-gray-700">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">{children}</div>
      </CardContent>
    </Card>
  )
}

function ProfileTab({ email }: { email: string }) {
  const qc = useQueryClient()
  const [editMode, setEditMode] = useState(false)
  const [draft, setDraft] = useState<Partial<EmployeeProfile>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: profile, isLoading } = useQuery({
    queryKey: ["employee_profile", email],
    queryFn: () => getEmployeeProfile(email),
    enabled: !!email,
  })

  const saveMutation = useMutation({
    mutationFn: () => adminUpdateProfile(email, draft),
    onSuccess: () => {
      toast.success("Profile saved")
      setEditMode(false)
      setDraft({})
      qc.invalidateQueries({ queryKey: ["employee_profile", email] })
    },
    onError: () => toast.error("Failed to save profile"),
  })

  const photoMutation = useMutation({
    mutationFn: (file: File) => uploadProfilePhoto(file, email),
    onSuccess: () => {
      toast.success("Photo updated")
      qc.invalidateQueries({ queryKey: ["employee_profile", email] })
    },
    onError: () => toast.error("Photo upload failed"),
  })

  function onChange(field: keyof EmployeeProfile, val: string) {
    setDraft((p) => ({ ...p, [field]: val }))
  }

  function fp(field: keyof EmployeeProfile, extra?: object) {
    return { field, value: profile ? (profile[field] as string) ?? "" : "", editMode, draft, onChange, ...extra }
  }

  if (isLoading) {
    return <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />)}</div>
  }
  if (!profile) {
    return <p className="text-gray-500 text-sm">No profile data found.</p>
  }

  return (
    <div className="space-y-4 pt-4">
      <div className="flex justify-end">
        {editMode ? (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { setDraft({}); setEditMode(false) }} className="gap-1">
              <X size={14} /> Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || Object.keys(draft).length === 0}
              className="gap-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Check size={14} /> {saveMutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setEditMode(true)} className="gap-1">
            <Pencil size={14} /> Edit Profile
          </Button>
        )}
      </div>

      {/* Avatar */}
      <Card className="bg-white shadow-sm border-0 ring-1 ring-gray-100">
        <CardContent className="pt-5 pb-5 px-5">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden shrink-0">
                {profile.image ? (
                  <img src={profile.image} alt={profile.employee_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-semibold text-blue-600">{getInitials(profile.employee_name)}</span>
                )}
              </div>
              {editMode && (
                <button
                  className="absolute bottom-0 right-0 bg-white border border-gray-200 rounded-full p-1 shadow hover:bg-gray-50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera size={13} className="text-gray-600" />
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) photoMutation.mutate(f) }} />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold text-gray-900">{profile.employee_name}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs font-normal">{profile.employee_id}</Badge>
                <Badge variant="secondary" className="text-xs font-normal bg-blue-50 text-blue-700">{profile.designation}</Badge>
                <Badge variant="secondary" className="text-xs font-normal bg-emerald-50 text-emerald-700">Active</Badge>
              </div>
              <p className="text-sm text-gray-500">{profile.company_email || profile.user_id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Section title="Personal Information">
        <ProfileField {...fp("date_of_birth")} label="Date of Birth" type="date" />
        <ProfileField {...fp("gender")} label="Gender" />
        <ProfileField {...fp("blood_group")} label="Blood Group" as="select" options={BLOOD_GROUPS} />
        <ProfileField {...fp("personal_email")} label="Personal Email" type="email" />
        <ProfileField {...fp("cell_number")} label="Personal Phone" />
        <ProfileField {...fp("current_address")} label="Address" />
        <ProfileField {...fp("person_to_be_contacted")} label="Emergency Contact" />
        <ProfileField {...fp("emergency_phone_number")} label="Emergency Phone" />
      </Section>

      <Section title="Work Information">
        <ProfileField field="employee_id" value={profile.employee_id} label="Employee ID" editMode={false} draft={draft} onChange={onChange} />
        <ProfileField {...fp("designation")} label="Designation" as="select"
          options={["", "Manager", "Project Manager", "Accounts Manager", "Accounts Executive", "GST & TDS Specialist", "Logistics Manager", "Stock Monitor", "Porter Executive"]} />
        <ProfileField field="department" value={departmentLabel(profile.department)} label="Department" editMode={false} draft={draft} onChange={onChange} />
        <ProfileField {...fp("date_of_joining")} label="Date of Joining" type="date" />
        <ProfileField {...fp("employment_type")} label="Employment Type" as="select"
          options={["", "Full-time", "Part-time", "Contract", "Probation"]} />
        <ProfileField field="reports_to_name" value={profile.reports_to_name} label="Reporting Manager" editMode={false} draft={draft} onChange={onChange} />
        <ProfileField {...fp("company_email")} label="Work Email" type="email" />
        <ProfileField {...fp("status")} label="Status" as="select" options={["Active", "Inactive", "Left"]} />
      </Section>

      <Card className="bg-white shadow-sm border-0 ring-1 ring-gray-100">
        <CardHeader className="pb-3 pt-4 px-5">
          <CardTitle className="text-sm font-semibold text-gray-700">Documents</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <ProfileField {...fp("custom_aadhaar_number")} label="Aadhaar Number" />
            <ProfileField {...fp("custom_pan_number")} label="PAN Number" />
          </div>
        </CardContent>
      </Card>

      <Section title="Bank Details">
        <ProfileField {...fp("bank_name")} label="Bank Name" />
        <ProfileField {...fp("bank_ac_no")} label="Account Number" />
        <ProfileField {...fp("custom_ifsc_code")} label="IFSC Code" />
      </Section>

      <Card className="bg-white shadow-sm border-0 ring-1 ring-gray-100">
        <CardHeader className="pb-3 pt-4 px-5">
          <CardTitle className="text-sm font-semibold text-gray-700">Skills & Education</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-4">
          <div className="space-y-1.5">
            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Skills</p>
            {editMode ? (
              <Input placeholder="e.g. GST Filing, TDS, Accounting"
                value={(draft.custom_skills ?? profile.custom_skills) || ""}
                onChange={(e) => onChange("custom_skills", e.target.value)}
                className="h-8 text-sm" />
            ) : profile.custom_skills ? (
              <div className="flex flex-wrap gap-1.5">
                {profile.custom_skills.split(",").map((s) => s.trim()).filter(Boolean).map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs font-normal">{s}</Badge>
                ))}
              </div>
            ) : <p className="text-sm text-gray-400 italic">No skills listed</p>}
          </div>
          {profile.education.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Education</p>
              {profile.education.map((e, i) => (
                <div key={i} className="text-sm text-gray-700">
                  <span className="font-medium">{e.qualification}</span>
                  {e.school && <span className="text-gray-500"> · {e.school}</span>}
                  {e.year && <span className="text-gray-400 ml-1">({e.year})</span>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Leave History Tab ─────────────────────────────────────────────────────────

function LeaveHistoryTab({ email }: { email: string }) {
  const qc = useQueryClient()
  const { data, isLoading } = useEmployeeLeaveHistory(email)
  const approve = useApproveLeave()
  const reject = useRejectLeave()
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [remarks, setRemarks] = useState("")

  async function handleApprove(id: string) {
    const res = await approve.mutateAsync({ leave_id: id })
    if (res.success) {
      toast.success("Leave approved")
      qc.invalidateQueries({ queryKey: ["employee_leave_history", email] })
    } else {
      toast.error(res.error ?? "Failed to approve")
    }
  }

  async function handleReject() {
    if (!rejectId) return
    if (!remarks.trim()) { toast.error("Rejection reason is required"); return }
    const res = await reject.mutateAsync({ leave_id: rejectId, admin_remarks: remarks })
    if (res.success) {
      toast.success("Leave rejected")
      setRejectId(null)
      setRemarks("")
      qc.invalidateQueries({ queryKey: ["employee_leave_history", email] })
    } else {
      toast.error(res.error ?? "Failed to reject")
    }
  }

  if (isLoading) return <div className="h-32 bg-gray-100 rounded-xl animate-pulse mt-4" />
  const leaves = data?.data ?? []

  return (
    <div className="pt-4 space-y-4">
      {leaves.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <CalendarDays size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">No leave records found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {leaves.map((leave) => (
            <Card key={leave.name} className="bg-white shadow-sm border-0 ring-1 ring-gray-100">
              <CardContent className="pt-4 pb-4 px-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{leave.leave_type}</span>
                      {statusBadge(leave.status)}
                    </div>
                    <p className="text-xs text-gray-500">
                      {leave.from_date} → {leave.to_date} · <span className="font-medium">{leave.total_days} day{leave.total_days !== 1 ? "s" : ""}</span>
                    </p>
                    {leave.reason && <p className="text-xs text-gray-600">{leave.reason}</p>}
                    {leave.admin_remarks && (
                      <p className="text-xs text-gray-500 italic">Remarks: {leave.admin_remarks}</p>
                    )}
                    <p className="text-[10px] text-gray-400">Applied {leave.applied_on}</p>
                  </div>
                  {leave.status === "Pending" && (
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleApprove(leave.name)}
                        disabled={approve.isPending}>
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => { setRejectId(leave.name); setRemarks("") }}>
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reject dialog */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Reject Leave Request</h3>
            <textarea
              className="w-full border border-gray-300 rounded-md text-sm p-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={3}
              placeholder="Reason for rejection (required)"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={() => { setRejectId(null); setRemarks("") }}>Cancel</Button>
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleReject} disabled={reject.isPending}>
                {reject.isPending ? "Rejecting…" : "Confirm Reject"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Permissions Tab ───────────────────────────────────────────────────────────

function PermissionsTab({ email }: { email: string }) {
  const { data, isLoading } = useUsersWithPermissions()
  const updateMutation = useUpdatePermissions()
  const [localPerms, setLocalPerms] = useState<Record<PermissionModule, boolean> | null>(null)
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)

  const userData = data?.users.find((u) => u.email === email)

  const perms: Record<PermissionModule, boolean> = localPerms
    ?? (userData ? { ...userData.permissions } : Object.fromEntries(ALL_MODULES.map((m) => [m, true])) as Record<PermissionModule, boolean>)

  function toggle(mod: PermissionModule) {
    setLocalPerms((prev) => {
      const base = prev ?? (userData ? { ...userData.permissions } : Object.fromEntries(ALL_MODULES.map((m) => [m, true])) as Record<PermissionModule, boolean>)
      return { ...base, [mod]: !base[mod] }
    })
    setDirty(true)
    setSaved(false)
  }

  async function handleSave() {
    try {
      const result = await updateMutation.mutateAsync({ email, permissions: perms })
      if (result && (result as { success?: boolean }).success === false) {
        toast.error((result as { error?: string }).error ?? "Failed to save permissions")
        return
      }
      setDirty(false)
      setSaved(true)
      toast.success("Permissions saved")
      setTimeout(() => setSaved(false), 3000)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save permissions")
    }
  }

  if (isLoading) return <div className="h-32 bg-gray-100 rounded-xl animate-pulse mt-4" />

  if (userData?.is_admin) {
    return (
      <div className="pt-4 text-center py-12 text-gray-400">
        <Lock size={32} className="mx-auto mb-2 opacity-40" />
        <p className="text-sm">Administrator — permissions cannot be modified</p>
      </div>
    )
  }

  return (
    <div className="pt-4 space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {ALL_MODULES.map((mod) => (
          <button
            key={mod}
            type="button"
            className="flex items-center gap-2 p-3 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 text-left"
            onClick={() => toggle(mod)}
          >
            <span className="text-lg leading-none">{MODULE_ICONS[mod]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">{PERMISSION_MODULE_LABELS[mod]}</p>
            </div>
            <Switch checked={perms[mod]} onCheckedChange={() => toggle(mod)} />
          </button>
        ))}
      </div>
      <div className="flex justify-end">
        <Button
          size="sm"
          disabled={!dirty || updateMutation.isPending}
          onClick={handleSave}
          className={saved ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
        >
          {saved ? <><Check size={14} className="mr-1" /> Saved</> : updateMutation.isPending ? "Saving…" : "Save Permissions"}
        </Button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function AdminEmployeeDetailPage() {
  const { email: rawEmail } = useParams<{ email: string }>()
  const email = rawEmail ? decodeURIComponent(rawEmail) : ""
  const navigate = useNavigate()
  const { user } = useAuth()

  const isAdmin = !!user && ADMIN_USERS.has(user.name)

  // All hooks must be called before any early return
  const { data: profile, isLoading } = useQuery({
    queryKey: ["employee_profile", email],
    queryFn: () => getEmployeeProfile(email),
    enabled: !!email && isAdmin,
  })

  if (!isAdmin) return <Navigate to="/" replace />

  return (
    <div className="p-6 max-w-5xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin/employees")} className="text-gray-400 hover:text-gray-700">
          <ArrowLeft size={18} />
        </button>
        {isLoading ? (
          <div className="space-y-1">
            <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
          </div>
        ) : (
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{profile?.employee_name ?? email}</h1>
            <p className="text-sm text-gray-500">
              {profile ? `${profile.designation} · ${departmentLabel(profile.department)}` : ""}
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile">
        <TabsList className="border border-gray-200 bg-gray-50">
          <TabsTrigger value="profile" className="text-xs px-4">Profile</TabsTrigger>
          <TabsTrigger value="leave" className="text-xs px-4 flex items-center gap-1">
            <CalendarDays size={12} /> Leave History
          </TabsTrigger>
          <TabsTrigger value="attendance" className="text-xs px-4 flex items-center gap-1">
            <Clock size={12} /> Attendance
          </TabsTrigger>
          <TabsTrigger value="permissions" className="text-xs px-4">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab email={email} />
        </TabsContent>

        <TabsContent value="leave">
          <LeaveHistoryTab email={email} />
        </TabsContent>

        <TabsContent value="attendance">
          <div className="pt-4 text-center py-16 text-gray-400">
            <Clock size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium text-gray-500">Attendance data coming soon</p>
            <p className="text-xs text-gray-400 mt-1">Jibble per-employee history will appear here</p>
          </div>
        </TabsContent>

        <TabsContent value="permissions">
          <PermissionsTab email={email} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
