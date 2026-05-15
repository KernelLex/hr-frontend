import { useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Camera, Pencil, Check, X, ArrowLeft, Lock,
  CalendarDays, Clock, Shield, Plus,
} from "lucide-react"
import { toast } from "sonner"
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
  "custom_aadhaar_number", "custom_pan_number",
])

const BLOOD_GROUPS = ["", "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]
const GENDER_OPTIONS = ["", "Male", "Female", "Non-binary", "Prefer not to say"]

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
}
function deptLabel(dept: string) {
  return dept.replace(/ - V$/, "")
}
function formatDate(raw: string): string {
  if (!raw) return ""
  const d = new Date(raw)
  if (isNaN(d.getTime())) return raw
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
}
function formatPhone(phone: string): string {
  if (!phone) return ""
  const digits = phone.replace(/\D/g, "")
  if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
  return phone
}

// ── Section card wrapper ─────────────────────────────────────────────────────

function SectionCard({
  title, icon, children,
}: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div
      className="bg-white rounded-xl p-6"
      style={{ border: "var(--border-card)", boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center gap-2 mb-5">
        <span
          className="w-1 h-5 rounded-full shrink-0"
          style={{ backgroundColor: "var(--brand-primary)" }}
        />
        <h2 className="font-semibold text-gray-800 flex items-center gap-1.5" style={{ fontSize: "15px" }}>
          {icon}
          {title}
        </h2>
      </div>
      {children}
    </div>
  )
}

// ── Single field (label + value or input) ────────────────────────────────────

interface FieldProps {
  label: string
  field: keyof EmployeeProfile
  value: string
  editMode: boolean
  canEditThis: boolean
  draft: Partial<EmployeeProfile>
  onChange: (f: keyof EmployeeProfile, v: string) => void
  type?: string
  as?: "select" | "textarea"
  options?: string[]
  format?: (v: string) => string
  fullWidth?: boolean
}

function Field({
  label, field, value, editMode, canEditThis, draft, onChange,
  type = "text", as, options, format, fullWidth,
}: FieldProps) {
  const current = String((draft[field] as string | undefined) ?? value ?? "")

  function display(raw: string) {
    if (!raw) return <span className="italic" style={{ color: "var(--text-muted)" }}>Not set</span>
    if (format) return format(raw)
    return raw
  }

  const labelEl = (
    <p
      className="font-medium uppercase tracking-wide mb-1"
      style={{ fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.05em" }}
    >
      {label}
    </p>
  )

  if (!editMode || !canEditThis) {
    return (
      <div className={fullWidth ? "col-span-2" : ""}>
        {labelEl}
        <div className="flex items-center gap-1.5">
          <p className="font-medium" style={{ fontSize: "14px", color: "var(--text-primary)" }}>
            {display(current)}
          </p>
          {editMode && !canEditThis && (
            <Lock size={11} style={{ color: "var(--text-muted)" }} />
          )}
        </div>
      </div>
    )
  }

  if (as === "select" && options) {
    return (
      <div className={fullWidth ? "col-span-2" : ""}>
        {labelEl}
        <select
          className="w-full rounded-lg text-sm font-medium"
          style={{
            border: "1px solid #C7D2FE",
            backgroundColor: "#EEF2FF",
            color: "var(--text-primary)",
            padding: "6px 10px",
          }}
          value={current}
          onChange={(e) => onChange(field, e.target.value)}
        >
          {options.map((o) => <option key={o} value={o}>{o || "—"}</option>)}
        </select>
      </div>
    )
  }

  if (as === "textarea") {
    return (
      <div className={fullWidth ? "col-span-2" : ""}>
        {labelEl}
        <textarea
          rows={2}
          className="w-full rounded-lg text-sm font-medium resize-none"
          style={{
            border: "1px solid #C7D2FE",
            backgroundColor: "#EEF2FF",
            color: "var(--text-primary)",
            padding: "6px 10px",
          }}
          value={current}
          onChange={(e) => onChange(field, e.target.value)}
        />
      </div>
    )
  }

  return (
    <div className={fullWidth ? "col-span-2" : ""}>
      {labelEl}
      <Input
        type={type}
        value={current}
        onChange={(e) => onChange(field, e.target.value)}
        className="h-8 text-sm font-medium"
        style={{ borderColor: "#C7D2FE", backgroundColor: "#EEF2FF" }}
      />
    </div>
  )
}

// ── Skills chips editor ──────────────────────────────────────────────────────

function SkillsEditor({
  value, editMode, canEdit, onChange,
}: { value: string; editMode: boolean; canEdit: boolean; onChange: (v: string) => void }) {
  const [newSkill, setNewSkill] = useState("")
  const skills = (value || "").split(",").map((s) => s.trim()).filter(Boolean)

  function addSkill() {
    const trimmed = newSkill.trim()
    if (!trimmed || skills.includes(trimmed)) return
    onChange([...skills, trimmed].join(", "))
    setNewSkill("")
  }

  function removeSkill(s: string) {
    onChange(skills.filter((x) => x !== s).join(", "))
  }

  if (!editMode || !canEdit) {
    if (skills.length === 0) {
      return (
        <p className="italic text-sm" style={{ color: "var(--text-muted)" }}>
          {canEdit ? "No skills listed — click Edit Profile to add" : "No skills listed"}
        </p>
      )
    }
    return (
      <div className="flex flex-wrap gap-2">
        {skills.map((s) => (
          <span
            key={s}
            className="text-xs font-medium px-3 py-1 rounded-full"
            style={{
              border: "1px solid #A5B4FC",
              color: "#4338CA",
              backgroundColor: "#EEF2FF",
            }}
          >
            {s}
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 min-h-[28px]">
        {skills.map((s) => (
          <span
            key={s}
            className="flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full"
            style={{ border: "1px solid #A5B4FC", color: "#4338CA", backgroundColor: "#EEF2FF" }}
          >
            {s}
            <button
              onClick={() => removeSkill(s)}
              className="hover:text-red-500 transition-colors ml-0.5"
              type="button"
            >
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Add a skill…"
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill() } }}
          className="h-8 text-sm flex-1"
          style={{ borderColor: "#C7D2FE", backgroundColor: "#EEF2FF" }}
        />
        <Button
          type="button"
          size="sm"
          onClick={addSkill}
          className="gap-1 text-white"
          style={{ backgroundColor: "var(--brand-primary)" }}
        >
          <Plus size={13} /> Add
        </Button>
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export function EmployeeProfilePage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const qc = useQueryClient()

  const isAdmin = !!user && ADMIN_USERS.has(user.name)
  const profileEmail = id ? decodeURIComponent(id) : user?.name ?? ""
  const isSelf = !id || user?.name === profileEmail

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

  function canEdit(field: keyof EmployeeProfile): boolean {
    if (!editMode) return false
    if (isAdmin) return true
    return isSelf && SELF_EDITABLE.has(field)
  }

  function fp(field: keyof EmployeeProfile, extra: Partial<FieldProps> = {}): FieldProps {
    return {
      label: "",
      field,
      value: profile ? String((profile[field] as string | undefined) ?? "") : "",
      editMode,
      canEditThis: canEdit(field),
      draft,
      onChange: handleChange,
      ...extra,
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-48 rounded-xl animate-pulse bg-gray-200" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`h-64 rounded-xl animate-pulse bg-gray-100 ${i <= 2 ? "lg:col-span-2" : "lg:col-span-3"}`} />
          ))}
        </div>
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

  const photoUrl = profile.image
  const canEditProfile = isAdmin || isSelf
  const skillsValue = String((draft.custom_skills as string | undefined) ?? profile.custom_skills ?? "")

  // ── Profile body ────────────────────────────────────────────────────────────

  const profileBody = (
    <div className="p-6 space-y-5">
      {/* ── Header card ─────────────────────────────────────────────────── */}
      <div
        className="bg-white rounded-xl overflow-hidden relative"
        style={{ border: "var(--border-card)", boxShadow: "var(--shadow-card)" }}
      >
        {/* Back button */}
        {isAdmin && id && (
          <button
            onClick={() => navigate("/admin/employees")}
            className="absolute top-4 left-4 z-10 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
        )}

        {/* Edit / Save buttons */}
        {canEditProfile && (
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            {editMode ? (
              <>
                <button
                  onClick={() => { setDraft({}); setEditMode(false) }}
                  className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium transition-colors"
                >
                  <X size={14} /> Cancel
                </button>
                <button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending || Object.keys(draft).length === 0}
                  className="flex items-center gap-1.5 text-white text-sm font-semibold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Check size={14} /> {saveMutation.isPending ? "Saving…" : "Save"}
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center gap-1.5 text-white/90 hover:text-white text-sm font-semibold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Pencil size={14} /> Edit Profile
              </button>
            )}
          </div>
        )}

        {/* Gradient banner (160px) */}
        <div
          className="w-full"
          style={{
            height: "160px",
            background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
          }}
        />

        {/* Avatar + info row */}
        <div className="px-8 pb-6" style={{ marginTop: "-50px" }}>
          <div className="flex items-end gap-5">
            {/* Avatar (100px, overlapping banner) */}
            <div className="relative shrink-0">
              <div
                className="w-[100px] h-[100px] rounded-full flex items-center justify-center overflow-hidden"
                style={{
                  backgroundColor: "#EEF2FF",
                  border: "4px solid white",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              >
                {photoUrl ? (
                  <img src={photoUrl} alt={profile.employee_name} className="w-full h-full object-cover" />
                ) : (
                  <span
                    className="font-bold"
                    style={{ fontSize: "28px", color: "var(--brand-primary)" }}
                  >
                    {getInitials(profile.employee_name)}
                  </span>
                )}
              </div>
              {editMode && canEditProfile && (
                <button
                  className="absolute bottom-1 right-1 bg-white border border-gray-200 rounded-full p-1.5 shadow-md hover:bg-gray-50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                >
                  <Camera size={14} className="text-gray-600" />
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

            {/* Name + meta */}
            <div className="pb-1 flex-1 min-w-0">
              <h1 className="font-bold leading-tight" style={{ fontSize: "24px", color: "var(--text-primary)" }}>
                {profile.employee_name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span
                  className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: "#EEF2FF", color: "#3730A3" }}
                >
                  {profile.designation}
                </span>
                <span
                  className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: "#EEF2FF", color: "#3730A3" }}
                >
                  {deptLabel(profile.department)}
                </span>
                <span
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: "#ECFDF5", color: "#065F46" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  Active
                </span>
              </div>
              <p className="text-sm mt-1.5" style={{ color: "var(--text-secondary)" }}>
                {profile.company_email}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Two-column body ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* LEFT COLUMN: Personal Info + Documents */}
        <div className="lg:col-span-2 space-y-5">

          {/* Personal Information */}
          <SectionCard title="Personal Information">
            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              <Field {...fp("date_of_birth", { label: "Date of Birth", type: "date", format: formatDate })} />
              <Field {...fp("gender", { label: "Gender", as: "select", options: GENDER_OPTIONS })} />
              <Field {...fp("blood_group", { label: "Blood Group", as: "select", options: BLOOD_GROUPS })} />
              <Field {...fp("personal_email", { label: "Personal Email", type: "email" })} />
              <Field {...fp("cell_number", { label: "Phone", format: formatPhone })} />
              <div className="col-span-2">
                <Field {...fp("current_address", { label: "Address", as: "textarea", fullWidth: true })} />
              </div>
              <Field {...fp("person_to_be_contacted", { label: "Emergency Contact" })} />
              <Field {...fp("emergency_phone_number", { label: "Emergency Phone", format: formatPhone })} />
            </div>
          </SectionCard>

          {/* Documents */}
          <SectionCard
            title="Documents"
            icon={<Shield size={14} style={{ color: "var(--brand-primary)" }} />}
          >
            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              {isAdmin ? (
                <>
                  <Field {...fp("custom_aadhaar_number", { label: "Aadhaar Number" })} />
                  <Field {...fp("custom_pan_number", { label: "PAN Number" })} />
                </>
              ) : (
                <>
                  {/* Self-editable Aadhaar */}
                  <div>
                    <p className="font-medium uppercase tracking-wide mb-1" style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      Aadhaar Number
                    </p>
                    {editMode ? (
                      <Input
                        placeholder="Enter Aadhaar number"
                        value={String((draft.custom_aadhaar_number as string | undefined) ?? "")}
                        onChange={(e) => handleChange("custom_aadhaar_number", e.target.value)}
                        className="h-8 text-sm font-medium"
                        style={{ borderColor: "#C7D2FE", backgroundColor: "#EEF2FF" }}
                      />
                    ) : (
                      <p className="font-medium flex items-center gap-1.5" style={{ fontSize: "14px", color: "var(--text-primary)" }}>
                        {profile.custom_aadhaar_number
                          ? <><Lock size={11} style={{ color: "var(--text-muted)" }} /> Stored securely</>
                          : <span className="italic" style={{ color: "var(--text-muted)" }}>Not set</span>}
                      </p>
                    )}
                  </div>
                  {/* Self-editable PAN */}
                  <div>
                    <p className="font-medium uppercase tracking-wide mb-1" style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      PAN Number
                    </p>
                    {editMode ? (
                      <Input
                        placeholder="Enter PAN number"
                        value={String((draft.custom_pan_number as string | undefined) ?? "")}
                        onChange={(e) => handleChange("custom_pan_number", e.target.value)}
                        className="h-8 text-sm font-medium"
                        style={{ borderColor: "#C7D2FE", backgroundColor: "#EEF2FF" }}
                      />
                    ) : (
                      <p className="font-medium flex items-center gap-1.5" style={{ fontSize: "14px", color: "var(--text-primary)" }}>
                        {profile.custom_pan_number
                          ? <><Lock size={11} style={{ color: "var(--text-muted)" }} /> Stored securely</>
                          : <span className="italic" style={{ color: "var(--text-muted)" }}>Not set</span>}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </SectionCard>
        </div>

        {/* RIGHT COLUMN: Work Info + Bank Details */}
        <div className="lg:col-span-3 space-y-5">

          {/* Work Information */}
          <SectionCard title="Work Information">
            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              <Field {...fp("employee_id", { label: "Employee ID" })} />
              <Field {...fp("designation", { label: "Designation" })} />
              <Field
                {...fp("department", {
                  label: "Department",
                  value: deptLabel(profile.department),
                })}
              />
              <Field {...fp("date_of_joining", { label: "Date of Joining", type: "date", format: formatDate })} />
              <Field
                {...fp("employment_type", {
                  label: "Employment Type",
                  as: isAdmin ? "select" : undefined,
                  options: ["", "Full-time", "Part-time", "Contract", "Probation"],
                })}
              />
              <Field {...fp("reports_to_name", { label: "Reporting Manager" })} />
              <Field {...fp("company_email", { label: "Work Email", type: "email" })} />
              <Field {...fp("status", { label: "Status" })} />
            </div>
          </SectionCard>

          {/* Bank Details */}
          <SectionCard title="Bank Details">
            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              <Field {...fp("bank_name", { label: "Bank Name" })} />
              <Field {...fp("bank_ac_no", { label: "Account Number" })} />
              <Field {...fp("custom_ifsc_code", { label: "IFSC Code" })} />
            </div>
          </SectionCard>
        </div>
      </div>

      {/* ── Full-width skills ────────────────────────────────────────────── */}
      <SectionCard title="Skills & Qualifications">
        <div className="space-y-4">
          <div>
            <p
              className="font-medium uppercase tracking-wide mb-3"
              style={{ fontSize: "11px", color: "var(--text-muted)" }}
            >
              Skills
            </p>
            <SkillsEditor
              value={skillsValue}
              editMode={editMode}
              canEdit={canEdit("custom_skills")}
              onChange={(v) => handleChange("custom_skills", v)}
            />
          </div>
          {profile.education.length > 0 && (
            <div>
              <p
                className="font-medium uppercase tracking-wide mb-2"
                style={{ fontSize: "11px", color: "var(--text-muted)" }}
              >
                Education
              </p>
              <div className="space-y-1.5">
                {profile.education.map((e, i) => (
                  <div key={i} className="text-sm" style={{ color: "var(--text-primary)" }}>
                    <span className="font-medium">{e.qualification}</span>
                    {e.school && <span style={{ color: "var(--text-secondary)" }}> · {e.school}</span>}
                    {e.year && <span style={{ color: "var(--text-muted)" }}> ({e.year})</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {editMode && (
        <p className="text-xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
          <Lock size={11} /> Fields with a lock icon can only be changed by an admin.
        </p>
      )}
    </div>
  )

  // ── Tab bar (self-view only) ────────────────────────────────────────────────

  if (id) {
    return (
      <div className="min-h-full" style={{ backgroundColor: "var(--bg-app)" }}>
        {profileBody}
      </div>
    )
  }

  return (
    <div className="min-h-full" style={{ backgroundColor: "var(--bg-app)" }}>
      <Tabs defaultValue="profile">
        {/* Tab bar */}
        <div
          className="bg-white border-b px-6 flex items-center gap-0"
          style={{ borderColor: "#E2E8F0" }}
        >
          <TabsList className="bg-transparent rounded-none h-auto p-0 gap-0">
            {[
              { value: "profile", label: "Profile" },
              { value: "leave", label: "Leave History", icon: <CalendarDays size={13} /> },
              { value: "attendance", label: "Attendance", icon: <Clock size={13} /> },
            ].map(({ value, label, icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="flex items-center gap-1.5 text-sm px-5 py-3.5 rounded-none border-b-2 border-transparent bg-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-700 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {icon}{label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="profile" className="mt-0">
          {profileBody}
        </TabsContent>

        <TabsContent value="leave" className="mt-0">
          <div className="p-6">
            <MyLeaveHistoryTab />
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="mt-0">
          <div className="flex flex-col items-center justify-center py-20" style={{ color: "var(--text-muted)" }}>
            <Clock size={40} className="mb-3 opacity-20" />
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Attendance history coming soon</p>
            <p className="text-xs mt-1">Your monthly Jibble data will appear here</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ── Leave history tab ────────────────────────────────────────────────────────

function MyLeaveHistoryTab() {
  const { data, isLoading } = useMyLeaves()
  const leaves: LeaveApplication[] = data?.data ?? []

  function statusBadge(status: string) {
    if (status === "Approved") return <Badge className="bg-emerald-50 text-emerald-700 border-0 text-xs">Approved</Badge>
    if (status === "Rejected") return <Badge className="bg-red-50 text-red-700 border-0 text-xs">Rejected</Badge>
    return <Badge className="bg-amber-50 text-amber-700 border-0 text-xs">Pending</Badge>
  }

  if (isLoading) return <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />

  if (leaves.length === 0) {
    return (
      <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>
        <CalendarDays size={36} className="mx-auto mb-3 opacity-20" />
        <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>No leave requests yet</p>
        <p className="text-xs mt-1">Apply for leave from the Leave page</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 max-w-2xl">
      {leaves.map((leave) => (
        <div
          key={leave.name}
          className="bg-white rounded-xl px-5 py-4"
          style={{ border: "var(--border-card)", boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {leave.leave_type}
                </span>
                {statusBadge(leave.status)}
              </div>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {leave.from_date} → {leave.to_date} · <span className="font-medium">{leave.total_days} day{leave.total_days !== 1 ? "s" : ""}</span>
              </p>
              {leave.reason && <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{leave.reason}</p>}
              {leave.admin_remarks && (
                <p className="text-xs italic" style={{ color: "var(--text-muted)" }}>
                  Admin remarks: {leave.admin_remarks}
                </p>
              )}
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Applied {leave.applied_on}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
