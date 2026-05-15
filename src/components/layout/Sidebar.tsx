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
  LogOut,
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
  { to: "/expenses", label: "Expenses", icon: Receipt, enabled: true, adminOnly: false, module: null },
  { to: "/admin/employees", label: "Team", icon: UserCog, enabled: true, adminOnly: true, module: null },
  { to: "/admin/permissions", label: "Permissions", icon: Shield, enabled: true, adminOnly: true, module: null },
]

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
}

interface SidebarProps {
  open?: boolean
}

export function Sidebar({ open = true }: SidebarProps) {
  const { user, logout } = useAuth()
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
        "flex flex-col shrink-0 transition-all duration-300 overflow-hidden",
        open ? "w-[220px]" : "w-0"
      )}
      style={{
        backgroundColor: "var(--bg-sidebar)",
        boxShadow: "var(--shadow-sidebar)",
      }}
    >
      {/* Branding */}
      <div className="px-4 pt-5 pb-4 shrink-0">
        <div className="flex items-center gap-2.5">
          {/* Indigo square logo mark */}
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
            style={{ backgroundColor: "var(--brand-primary)" }}
          >
            <span className="text-white font-bold text-xs">V</span>
          </div>
          <span className="text-white font-bold text-[17px] tracking-tight whitespace-nowrap">Vera ERP</span>
        </div>
        {/* Indigo accent underline */}
        <div className="mt-3 h-px" style={{ backgroundColor: "rgba(79,70,229,0.4)" }} />
      </div>

      {/* Nav */}
      <nav className="flex-1 py-1 px-2 space-y-0.5 overflow-y-auto">
        {visibleItems.map(({ to, label, icon: Icon, enabled, adminOnly }) =>
          enabled ? (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap mx-0",
                  isActive
                    ? "text-white"
                    : "hover:text-[#E2E8F0]"
                )
              }
              style={({ isActive }) =>
                isActive
                  ? {
                      backgroundColor: "var(--bg-sidebar-active)",
                      color: "var(--text-sidebar-active)",
                      boxShadow: "0 2px 8px rgba(79,70,229,0.4)",
                    }
                  : {}
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={15}
                    style={{
                      color: isActive ? "#FFFFFF" : "#64748B",
                      transition: "color 0.15s",
                    }}
                    className={cn(!isActive && "group-hover:text-[#A5B4FC]")}
                  />
                  <span style={{ color: isActive ? "#FFFFFF" : "#94A3B8" }}>{label}</span>
                  {to === "/crm" && isOwais && crmPendingCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                      {crmPendingCount}
                    </span>
                  )}
                  {adminOnly && to !== "/crm" && (
                    <span
                      className="ml-auto text-[10px] font-normal rounded px-1.5 py-0.5"
                      style={{
                        backgroundColor: "#1E293B",
                        color: "#64748B",
                        fontSize: "10px",
                        borderRadius: "4px",
                        padding: "2px 6px",
                      }}
                    >
                      admin
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ) : (
            <div
              key={to}
              className="flex items-center gap-2.5 rounded-lg text-sm font-medium cursor-not-allowed select-none whitespace-nowrap"
              style={{
                padding: "10px 12px",
                color: "#475569",
                margin: "1px 0",
              }}
            >
              <Icon size={15} style={{ color: "#334155" }} />
              <span>{label}</span>
              <span
                className="ml-auto"
                style={{
                  backgroundColor: "#1E293B",
                  color: "#64748B",
                  fontSize: "10px",
                  borderRadius: "4px",
                  padding: "2px 6px",
                }}
              >
                soon
              </span>
            </div>
          )
        )}
      </nav>

      {/* User section */}
      <div
        className="shrink-0 px-3 py-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="flex items-center gap-2.5 mb-2.5">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold text-white"
            style={{ backgroundColor: "var(--brand-primary)" }}
          >
            {user?.full_name ? getInitials(user.full_name) : "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate leading-tight">
              {user?.full_name ?? "—"}
            </p>
            <p className="text-[11px] truncate leading-tight" style={{ color: "#64748B" }}>
              {user?.name ?? ""}
            </p>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-2 text-xs rounded-md px-2 py-1.5 transition-colors"
          style={{ color: "#64748B" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#1E293B"
            e.currentTarget.style.color = "#94A3B8"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent"
            e.currentTarget.style.color = "#64748B"
          }}
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
