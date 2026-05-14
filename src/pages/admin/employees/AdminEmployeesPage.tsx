import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { ExternalLink, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/context/AuthContext"
import { getAllEmployees, type EmployeeListItem } from "@/api/employee"
import { Navigate } from "react-router-dom"

const ADMIN_USERS = new Set(["Administrator", "owais@veraenterprises.in"])

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
}

function departmentLabel(dept: string) {
  return dept.replace(/ - V$/, "")
}

const DEPT_COLORS: Record<string, string> = {
  Management: "bg-purple-50 text-purple-700",
  Project: "bg-blue-50 text-blue-700",
  Accounts: "bg-emerald-50 text-emerald-700",
  Logistics: "bg-orange-50 text-orange-700",
}

function EmployeeCardItem({ emp }: { emp: EmployeeListItem }) {
  const navigate = useNavigate()
  const dept = departmentLabel(emp.department)
  const colorClass = DEPT_COLORS[dept] ?? "bg-gray-50 text-gray-700"
  const empEmail = emp.user_id || emp.company_email
  const pendingLeaves = emp.pending_leaves ?? 0

  return (
    <Card className="bg-white shadow-sm border-0 ring-1 ring-gray-100 hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => navigate(`/admin/employees/${encodeURIComponent(empEmail)}`)}
    >
      <CardContent className="pt-5 pb-4 px-5">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden shrink-0">
              {emp.image ? (
                <img src={emp.image} alt={emp.employee_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-semibold text-blue-600">{getInitials(emp.employee_name)}</span>
              )}
            </div>
            {pendingLeaves > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {pendingLeaves}
              </span>
            )}
          </div>
          <div className="space-y-1 min-w-0 w-full">
            <p className="font-semibold text-gray-900 text-sm truncate">{emp.employee_name}</p>
            <p className="text-xs text-gray-500 truncate">{emp.designation}</p>
            <Badge className={`text-[10px] font-normal px-2 py-0.5 ${colorClass} border-0`}>
              {dept}
            </Badge>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="w-full mt-4 h-7 text-xs gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/admin/employees/${encodeURIComponent(empEmail)}`)
          }}
        >
          <ExternalLink size={11} /> View Details
        </Button>
      </CardContent>
    </Card>
  )
}

function SkeletonCard() {
  return (
    <Card className="bg-white shadow-sm border-0 ring-1 ring-gray-100">
      <CardContent className="pt-5 pb-4 px-5 animate-pulse">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-gray-200" />
          <div className="space-y-2 w-full">
            <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto" />
            <div className="h-3 bg-gray-100 rounded w-1/2 mx-auto" />
            <div className="h-4 bg-gray-100 rounded w-1/3 mx-auto" />
          </div>
          <div className="h-7 bg-gray-100 rounded w-full mt-1" />
        </div>
      </CardContent>
    </Card>
  )
}

export function AdminEmployeesPage() {
  const { user } = useAuth()
  const isAdmin = user && ADMIN_USERS.has(user.name)

  const { data: employees, isLoading } = useQuery({
    queryKey: ["all_employees"],
    queryFn: getAllEmployees,
    staleTime: 1000 * 60,
    enabled: !!isAdmin,
  })

  if (!isAdmin) return <Navigate to="/" replace />

  return (
    <div className="p-6 max-w-5xl space-y-5">
      <div className="flex items-center gap-3">
        <Users size={20} className="text-gray-600" />
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Team Members</h1>
          <p className="text-sm text-gray-500">
            {isLoading ? "Loading…" : `${employees?.length ?? 0} active employees`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          : employees?.map((emp) => <EmployeeCardItem key={emp.name} emp={emp} />)}
      </div>
    </div>
  )
}
