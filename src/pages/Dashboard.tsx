import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Briefcase, UserCheck, CalendarClock, Plus, UserPlus, Clock, Shield, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { api, apiUrl } from "@/lib/api"

const ADMIN_USERS = new Set(["Administrator", "owais@veraenterprises.in"])

const DOT_COLORS: Record<string, string> = {
  blue: "bg-blue-400",
  violet: "bg-violet-400",
  emerald: "bg-emerald-400",
  gray: "bg-gray-400",
  red: "bg-red-400",
}

function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard_stats"],
    queryFn: async () => {
      const res = await api.get(apiUrl("hr_client.api.dashboard.get_dashboard_stats"))
      return res.data.message as {
        stats: {
          total_employees: number
          open_positions: number
          candidates_this_month: number
          interviews_today: number
        }
        recent_activity: Array<{
          action: string
          detail: string
          time: string
          dot: string
        }>
      }
    },
    staleTime: 1000 * 60,
  })
}

function StatSkeleton() {
  return (
    <Card className="bg-white shadow-md ring-0 border-0">
      <CardContent className="pt-4 pb-4 animate-pulse">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-24" />
            <div className="h-7 bg-gray-300 rounded w-12" />
            <div className="h-3 bg-gray-100 rounded w-20" />
          </div>
          <div className="h-10 w-10 bg-gray-100 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

export function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user && ADMIN_USERS.has(user.name)
  const { data, isLoading } = useDashboardStats()

  const stats = data?.stats
  const activity = data?.recent_activity ?? []

  const STAT_CARDS = [
    {
      label: "Total Employees",
      value: stats?.total_employees ?? "—",
      sub: "Active employees",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Open Positions",
      value: stats?.open_positions ?? "—",
      sub: "Job openings",
      icon: Briefcase,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: "Candidates This Month",
      value: stats?.candidates_this_month ?? "—",
      sub: "New applicants",
      icon: UserCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Interviews Today",
      value: stats?.interviews_today ?? "—",
      sub: "Scheduled today",
      icon: CalendarClock,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ]

  return (
    <div className="p-6 max-w-5xl space-y-6 min-h-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          {getGreeting()}{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Here's what's happening today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
          : STAT_CARDS.map(({ label, value, sub, icon: Icon, color, bg }) => (
              <Card key={label} className="bg-white shadow-md ring-0 border-0">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">{label}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
                    </div>
                    <div className={`${bg} p-2 rounded-lg`}>
                      <Icon size={18} className={color} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 bg-white shadow-md ring-0 border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-800">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 animate-pulse">
                  <span className="mt-1.5 size-2 rounded-full shrink-0 bg-gray-200" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                  </div>
                  <div className="h-3 bg-gray-100 rounded w-12" />
                </div>
              ))
            ) : activity.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No activity yet — add job openings and candidates to get started.</p>
            ) : (
              activity.map(({ action, detail, time, dot }, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className={`mt-1.5 size-2 rounded-full shrink-0 ${DOT_COLORS[dot] ?? "bg-gray-400"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{action}</p>
                    <p className="text-xs text-gray-500 truncate">{detail}</p>
                  </div>
                  <span className="text-[11px] text-gray-400 shrink-0 mt-0.5">{time}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-white shadow-md ring-0 border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-800">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 h-9 text-sm"
              onClick={() => navigate("/recruitment")}
            >
              <Plus size={14} className="text-violet-600" />
              Post New Job
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 h-9 text-sm"
              onClick={() => navigate("/recruitment")}
            >
              <UserPlus size={14} className="text-blue-600" />
              Add Candidate
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 h-9 text-sm"
              onClick={() => navigate("/recruitment")}
            >
              <Clock size={14} className="text-orange-600" />
              Schedule Interview
            </Button>
            {isAdmin && (
              <Button
                variant="outline"
                className="w-full justify-start gap-2 h-9 text-sm border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
                onClick={() => navigate("/admin/attendance")}
              >
                <Activity size={14} className="text-green-600" />
                Live Attendance
              </Button>
            )}
            {isAdmin && (
              <Button
                variant="outline"
                className="w-full justify-start gap-2 h-9 text-sm border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300"
                onClick={() => navigate("/admin/permissions")}
              >
                <Shield size={14} className="text-purple-600" />
                Role Control
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
