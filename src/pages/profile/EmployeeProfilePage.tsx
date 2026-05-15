import { useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Camera, Pencil, Check, X, ArrowLeft, Lock, CalendarDays, Clock } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useAuth } from "@/context/AuthContext"
import {
  getEmployeeProfile,
  updateOwnProfile,
  adminUpdateProfile,
  uploadProfilePhoto,
  type EmployeeProfile,
} from "@/api/employee"
import { useMyLeaves } from "@/pages/leave/useLeave"
import type { LeaveApplication } from "@/pages/leave/types"

const ADMIN_USERS = new Set(["Administrator", "owais@veraenterprises.in"])

const SELF_EDITABLE = new Set([
  "image", "personal_email", "cell_number", "person_to_be_contacted",
  "emergency_phone_number", "current_address", "blood_group", "gender",
  "bank_name", "bank_ac_no", "custom_ifsc_code", "custom_skills",
])

const BLOOD_GROUPS = ["", "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]
const GENDER_OPTIONS = ["", "Male", "Female", "Non-binary", "Prefer not to say"]

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
}

function departmentLabel(dept: string) {
  return dept.replace(/ - V$/, "")
}

function formatDateDisplay(date: string): string {
  if (!date) return ""
  const d = new Date(date)
  if (isNaN(d.getTime())) return date
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
}

function formatPhone(phone: string): string {
  if (!phone) return ""
  const digits = phone.replace(/\D/g, "")
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
  }
  return phone
}

interface FieldProps {
  label: string
  value: string
  field: keyof EmployeeProfile
  editMode: boolean
  isAdmin: boolean
  isSelf: boolean
  draft: Partial<EmployeeProfile>
  onChange: (field: keyof EmployeeProfile, val: string) => void
  locked?: boolean
  type?: string
  as?: "select"
  options?: string[]
}

function ProfileField({ label, value, field, editMode, isAdmin, isSelf, draft, onChange, locked, type = "text", as, options }: FieldProps) {
  const canEdit = editMode && (isAdmin || (isSelf && SELF_EDITABLE.has(field)))
  const currentVal = (draft[field] as string) ?? value

  // Display value with field-specific formatting
  function displayValue(raw: string) {
    if (!raw) return <span className="text-gray-400 italic">Not set</span>
    if (field === "date_of_birth" || (field === "date_of_joining" && !canEdit)) return formatDateDisplay(raw)
    if (field === "cell_number" || field === "emergency_phone_number") return formatPhone(raw)
    return raw
  }

  if (!canEdit) {
    return (
      <div className="space-y-0.5">
        <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <div className="flex items-center gap-1.5">
          <p className="text-sm text-gray-800">{displayValue(currentVal)}</p>
          {editMode && locked && <Lock size={11} className="text-gray-300" />}
        </div>
      </div>
    )
  }

  if (as === "select" && options) {
    return (
      <div className="space-y-0.5">
        <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <select
          className="w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={currentVal}
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
      <Input
        type={type}
        value={currentVal}
        onChange={(e) => onChange(field, e.target.value)}
        className="h-8 text-sm"
      />
    </div>
  )
}

interface ProfileSectionProps {
  title: string
  children: React.ReactNode
}

function Section({ title, children }: ProfileSectionProps) {
  return (
    <Card className="bg-white shadow-sm border-0" style={{ border: "var(--border-card)", borderRadius: "12px", boxShadow: "var(--shadow-card)" }}>
      <CardHeader className="pb-3 pt-4 px-5">
        <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <span className="w-1 h-4 rounded-full inline-block" style={{ backgroundColor: "var(--brand-primary)" }} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">{children}</div>
      </CardContent>
    </Card>
  )
}

export function EmployeeProfilePage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const qc = useQueryClient()

  const isAdmin = !!user && ADMIN_USERS.has(user.name)
  const profileEmail = id ? decodeURIComponent(id) : user?.name ?? ""
  const isSelf = user?.name === profileEmail || (!id && true)

  const [editMode, setEditMode] = useState(false)
  const [draft, setDraft] = useState<Partial<EmployeeProfile>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["employee_profile", profileEmail],
    queryFn: () => getEmployeeProfile(profileEmail),
    enabled: !!profileEmail,
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!profile) return
      if (isAdmin && !isSelf) {
        await adminUpdateProfile(profileEmail, draft)
      } else {
        await updateOwnProfile(draft)
      }
    },
    onSuccess: () => {
      toast.success("Profile saved")
      setEditMode(false)
      setDraft({})
      qc.invalidateQueries({ queryKey: ["employee_profile", profileEmail] })
    },
    onError: () => toast.error("Failed to save profile"),
  })

  const photoMutation = useMutation({
    mutationFn: (file: File) => uploadProfilePhoto(file, isSelf ? undefined : profileEmail),
    onSuccess: () => {
      toast.success("Photo updated")
      qc.invalidateQueries({ queryKey: ["employee_profile", profileEmail] })
    },
    onError: () => toast.error("Photo upload failed"),
  })

  function handleChange(field: keyof EmployeeProfile, val: string) {
    setDraft((prev) => ({ ...prev, [field]: val }))
  }

  function handleCancel() {
    setDraft({})
    setEditMode(false)
  }

  function fieldProps(field: keyof EmployeeProfile, extra?: Partial<FieldProps>): FieldProps {
    return {
      label: "",
      value: profile ? (profile[field] as string) ?? "" : "",
      field,
      editMode,
      isAdmin,
      isSelf,
      draft,
      onChange: handleChange,
      locked: !SELF_EDITABLE.has(field),
      ...extra,
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-4xl">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>No employee profile found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>Go back</Button>
      </div>
    )
  }

  const canEdit = isAdmin || isSelf
  const photoUrl = profile.image

  const profileContent = (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isAdmin && id && (
            <button onClick={() => navigate("/admin/employees")} className="text-gray-400 hover:text-gray-700">
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {isSelf && !id ? "My Profile" : profile.employee_name}
            </h1>
            <p className="text-sm text-gray-500">{profile.designation} · {departmentLabel(profile.department)}</p>
          </div>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            {editMode ? (
              <>
                <Button size="sm" variant="outline" onClick={handleCancel} className="gap-1">
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
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setEditMode(true)} className="gap-1">
                <Pencil size={14} /> Edit Profile
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Avatar + ID card with gradient banner */}
      <Card className="border-0 overflow-hidden" style={{ border: "var(--border-card)", borderRadius: "16px", boxShadow: "var(--shadow-card)" }}>
        {/* Gradient banner */}
        <div
          className="h-20 relative"
          style={{ background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)" }}
        />
        {/* Avatar overlapping banner */}
        <CardContent className="px-5 pb-5 pt-0">
          <div className="relative" style={{ marginTop: "-36px" }}>
            <div className="relative inline-block">
              <div
                className="w-[72px] h-[72px] rounded-full flex items-center justify-center overflow-hidden shrink-0"
                style={{
                  backgroundColor: "#EEF2FF",
                  border: "3px solid white",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                }}
              >
                {photoUrl ? (
                  <img src={photoUrl} alt={profile.employee_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-bold" style={{ color: "var(--brand-primary)" }}>
                    {getInitials(profile.employee_name)}
                  </span>
                )}
              </div>
              {editMode && canEdit && (
                <button
                  className="absolute bottom-0 right-0 bg-white border border-gray-200 rounded-full p-1 shadow hover:bg-gray-50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera size={13} className="text-gray-600" />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) photoMutation.mutate(file)
                }}
              />
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            <p className="font-bold" style={{ fontSize: "22px", color: "var(--text-primary)" }}>
              {profile.employee_name}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                style={{ backgroundColor: "#EEF2FF", color: "#3730A3" }}
              >
                {profile.designation}
              </span>
              <span
                className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                style={{ backgroundColor: "#EEF2FF", color: "#3730A3" }}
              >
                {departmentLabel(profile.department)}
              </span>
              <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full" style={{ backgroundColor: "#ECFDF5", color: "#065F46" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Active
              </span>
            </div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {profile.company_email}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Section title="Personal Information">
        <ProfileField {...fieldProps("date_of_birth")} label="Date of Birth" type="date" />
        <ProfileField {...fieldProps("gender")} label="Gender" as="select" options={GENDER_OPTIONS} />
        <ProfileField {...fieldProps("blood_group")} label="Blood Group" as="select" options={BLOOD_GROUPS} />
        <ProfileField {...fieldProps("personal_email")} label="Personal Email" type="email" />
        <ProfileField {...fieldProps("cell_number")} label="Personal Phone" />
        <ProfileField {...fieldProps("current_address")} label="Address" />
        <ProfileField {...fieldProps("person_to_be_contacted")} label="Emergency Contact Name" />
        <ProfileField {...fieldProps("emergency_phone_number")} label="Emergency Phone" />
      </Section>

      {/* Work Info */}
      <Section title="Work Information">
        <ProfileField {...fieldProps("employee_id")} label="Employee ID" locked />
        <ProfileField {...fieldProps("designation")} label="Designation" locked />
        <ProfileField {...fieldProps("department")} label="Department"
          value={departmentLabel(profile.department)} locked />
        <ProfileField {...fieldProps("date_of_joining")} label="Date of Joining" type="date" locked />
        <ProfileField {...fieldProps("employment_type")} label="Employment Type"
          as={isAdmin ? "select" : undefined}
          options={["", "Full-time", "Part-time", "Contract", "Probation"]} />
        <ProfileField {...fieldProps("reports_to_name")} label="Reporting Manager" locked />
        <ProfileField {...fieldProps("company_email")} label="Work Email" type="email" locked />
      </Section>

      {/* Documents */}
      <Card className="bg-white shadow-sm border-0" style={{ border: "var(--border-card)", borderRadius: "12px", boxShadow: "var(--shadow-card)" }}>
        <CardHeader className="pb-3 pt-4 px-5">
          <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full inline-block" style={{ backgroundColor: "var(--brand-primary)" }} />
            Documents
            {!isAdmin && <Lock size={12} className="text-gray-300 ml-1" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            {isAdmin ? (
              <>
                <ProfileField {...fieldProps("custom_aadhaar_number")} label="Aadhaar Number" />
                <ProfileField {...fieldProps("custom_pan_number")} label="PAN Number" />
              </>
            ) : (
              <>
                <div className="space-y-0.5">
                  <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Aadhaar Number</p>
                  <p className="text-sm text-gray-800">
                    {profile.custom_aadhaar_number
                      ? <span className="flex items-center gap-1"><Lock size={11} className="text-gray-400" /> Stored securely</span>
                      : <span className="text-gray-400 italic">Not set</span>}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">PAN Number</p>
                  <p className="text-sm text-gray-800">
                    {profile.custom_pan_number
                      ? <span className="flex items-center gap-1"><Lock size={11} className="text-gray-400" /> Stored securely</span>
                      : <span className="text-gray-400 italic">Not set</span>}
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bank Details */}
      <Section title="Bank Details">
        <ProfileField {...fieldProps("bank_name")} label="Bank Name" />
        <ProfileField {...fieldProps("bank_ac_no")} label="Account Number" />
        <ProfileField {...fieldProps("custom_ifsc_code")} label="IFSC Code" />
      </Section>

      {/* Skills */}
      <Card className="bg-white shadow-sm border-0" style={{ border: "var(--border-card)", borderRadius: "12px", boxShadow: "var(--shadow-card)" }}>
        <CardHeader className="pb-3 pt-4 px-5">
          <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full inline-block" style={{ backgroundColor: "var(--brand-primary)" }} />
            Skills & Qualifications
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-4">
          <div className="space-y-1.5">
            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Skills</p>
            {editMode && (isAdmin || isSelf) ? (
              <Input
                placeholder="e.g. GST Filing, TDS, Accounting"
                value={(draft.custom_skills ?? profile.custom_skills) || ""}
                onChange={(e) => handleChange("custom_skills", e.target.value)}
                className="h-8 text-sm"
              />
            ) : profile.custom_skills ? (
              <div className="flex flex-wrap gap-1.5">
                {profile.custom_skills.split(",").map((s) => s.trim()).filter(Boolean).map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs font-normal">{s}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No skills listed</p>
            )}
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

      {editMode && <p className="text-[11px] text-gray-400 flex items-center gap-1"><Lock size={10} /> Greyed fields are locked and cannot be edited.</p>}
    </div>
  )

  // For admin viewing someone else's profile via /employee/profile/:id, show without tabs
  if (id) {
    return <div className="p-6 max-w-4xl">{profileContent}</div>
  }

  // Self-view /my-profile — show with tabs
  return (
    <div className="p-6 max-w-4xl space-y-5">
      <Tabs defaultValue="profile">
        <TabsList className="border-b border-gray-200 bg-transparent rounded-none w-full justify-start gap-0 h-auto p-0">
          <TabsTrigger
            value="profile"
            className="text-sm px-4 py-2.5 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-700 data-[state=active]:bg-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          >
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="leave"
            className="text-sm px-4 py-2.5 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-700 data-[state=active]:bg-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 flex items-center gap-1"
          >
            <CalendarDays size={13} /> Leave History
          </TabsTrigger>
          <TabsTrigger
            value="attendance"
            className="text-sm px-4 py-2.5 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-700 data-[state=active]:bg-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 flex items-center gap-1"
          >
            <Clock size={13} /> Attendance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          {profileContent}
        </TabsContent>

        <TabsContent value="leave">
          <MyLeaveHistoryTab />
        </TabsContent>

        <TabsContent value="attendance">
          <div className="text-center py-16 text-gray-400">
            <Clock size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium text-gray-500">Attendance history coming soon</p>
            <p className="text-xs text-gray-400 mt-1">Your monthly Jibble data will appear here</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function MyLeaveHistoryTab() {
  const { data, isLoading } = useMyLeaves()
  const leaves: LeaveApplication[] = data?.data ?? []

  function statusBadge(status: string) {
    if (status === "Approved") return <Badge className="bg-emerald-50 text-emerald-700 border-0 text-xs">Approved</Badge>
    if (status === "Rejected") return <Badge className="bg-red-50 text-red-700 border-0 text-xs">Rejected</Badge>
    return <Badge className="bg-amber-50 text-amber-700 border-0 text-xs">Pending</Badge>
  }

  if (isLoading) return <div className="h-32 bg-gray-100 rounded-xl animate-pulse mt-4" />

  if (leaves.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <CalendarDays size={36} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm font-medium text-gray-500">No leave requests yet</p>
        <p className="text-xs text-gray-400 mt-1">Apply for leave from the Leave page</p>
      </div>
    )
  }

  return (
    <div className="pt-4 space-y-2">
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
                  <p className="text-xs text-gray-500 italic">Admin remarks: {leave.admin_remarks}</p>
                )}
                <p className="text-[10px] text-gray-400">Applied {leave.applied_on}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
