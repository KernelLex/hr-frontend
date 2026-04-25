import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Briefcase, UserCheck, CalendarClock, Plus, UserPlus, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

const STATS = [
  { label: "Total Employees", value: "47", sub: "+2 this month", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Open Positions", value: "5", sub: "3 actively hiring", icon: Briefcase, color: "text-violet-600", bg: "bg-violet-50" },
  { label: "Candidates This Month", value: "23", sub: "+8 vs last month", icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
  { label: "Interviews Today", value: "4", sub: "Next at 2:00 PM", icon: CalendarClock, color: "text-orange-600", bg: "bg-orange-50" },
]

const ACTIVITY = [
  { action: "New candidate added", detail: "Priya Nair applied for Senior Backend Engineer", time: "10 min ago", dot: "bg-blue-400" },
  { action: "Interview scheduled", detail: "Dev Patel — Technical Round 1 on Apr 22", time: "1 hr ago", dot: "bg-violet-400" },
  { action: "Offer accepted", detail: "Meena Sharma accepted offer for Backend Engineer", time: "3 hrs ago", dot: "bg-emerald-400" },
  { action: "Job opening posted", detail: "Product Designer — Design team", time: "Yesterday", dot: "bg-gray-400" },
  { action: "Candidate rejected", detail: "Amit Joshi — Senior Backend Engineer", time: "Yesterday", dot: "bg-red-400" },
]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

export function Dashboard() {
  const navigate = useNavigate()

  return (
    <div className="p-6 max-w-5xl space-y-6 min-h-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{getGreeting()}, HR Team</h1>
        <p className="text-sm text-gray-500 mt-0.5">Here's what's happening today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ label, value, sub, icon: Icon, color, bg }) => (
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
            {ACTIVITY.map(({ action, detail, time, dot }, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className={`mt-1.5 size-2 rounded-full shrink-0 ${dot}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{action}</p>
                  <p className="text-xs text-gray-500 truncate">{detail}</p>
                </div>
                <span className="text-[11px] text-gray-400 shrink-0 mt-0.5">{time}</span>
              </div>
            ))}
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
