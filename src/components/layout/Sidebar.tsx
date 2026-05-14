import { NavLink } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  Clock,
  BarChart2,
  Receipt,
  Briefcase,
  Shield,
  UserCircle,
  UserCog,
  CalendarDays,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { usePermissions } from "@/context/PermissionsContext"
import { usePendingApprovals } from "@/pages/crm/useCRM"

const ADMIN_USERS = new Set(["Administrator", "owais@veraenterprises.in"])

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, enabled: true, adminOnly: false, module: null },
  { to: "/my-profile", label: "My Profile", icon: UserCircle, enabled: true, adminOnly: false, module: null },
  { to: "/leave", label: "Leave", icon: CalendarDays, enabled: true, adminOnly: false, module: "attendance" },
  { to: "/recruitment", label: "Recruitment", icon: Briefcase, enabled: true, adminOnly: false, module: "recruitment" },
  { to: "/crm", label: "CRM", icon: Briefcase, enabled: true, adminOnly: false, module: null },
  { to: "/employees", label: "Employees", icon: Users, enabled: true, adminOnly: false, module: "employee_lifecycle" },
  { to: "/admin/attendance", label: "Attendance", icon: Clock, enabled: true, adminOnly: true, module: null },
  { to: "/performance", label: "Performance", icon: BarChart2, enabled: false, adminOnly: false, module: null },
  { to: "/expenses", label: "Expenses", icon: Receipt, enabled: false, adminOnly: false, module: "expense" },
  { to: "/admin/employees", label: "Team", icon: UserCog, enabled: true, adminOnly: true, module: null },
  { to: "/admin/permissions", label: "Permissions", icon: Shield, enabled: true, adminOnly: true, module: null },
]

interface SidebarProps {
  open?: boolean
}

export function Sidebar({ open = true }: SidebarProps) {
  const { user } = useAuth()
  const { moduleEnabled } = usePermissions()
  const isAdmin = user && ADMIN_USERS.has(user.name)
  const isOwais = isAdmin

  const { data: pendingData } = usePendingApprovals(!!isOwais)
  const crmPendingCount = pendingData?.count ?? 0

  const visibleItems = NAV_ITEMS.filter(
    (item) =>
      (!item.adminOnly || isAdmin) &&
      (!item.module || moduleEnabled(item.module))
  )

  return (
    <aside
      className={cn(
        "bg-gray-900 text-gray-100 flex flex-col shrink-0 transition-all duration-300 overflow-hidden",
        open ? "w-56" : "w-0"
      )}
    >
      <div className="h-14 flex items-center px-4 border-b border-gray-800 shrink-0">
        <span className="font-bold text-white text-base tracking-tight whitespace-nowrap">Vera ERP</span>
      </div>
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {visibleItems.map(({ to, label, icon: Icon, enabled, adminOnly }) =>
          enabled ? (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? adminOnly ? "bg-purple-600 text-white" : "bg-blue-600 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
                )
              }
            >
              <Icon size={16} />
              {label}
              {to === "/crm" && isOwais && crmPendingCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                  {crmPendingCount}
                </span>
              )}
              {adminOnly && to !== "/crm" && (
                <span className="ml-auto text-[9px] bg-purple-800 text-purple-200 px-1.5 py-0.5 rounded font-normal">
                  admin
                </span>
              )}
            </NavLink>
          ) : (
            <div
              key={to}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-gray-600 cursor-not-allowed select-none whitespace-nowrap"
            >
              <Icon size={16} />
              <span>{label}</span>
              <span className="ml-auto text-[10px] text-gray-700 font-normal">soon</span>
            </div>
          )
        )}
      </nav>
      <div className="p-3 border-t border-gray-800 shrink-0">
        <p className="text-[11px] text-gray-600 whitespace-nowrap">HR Module v0.1</p>
      </div>
    </aside>
  )
}
