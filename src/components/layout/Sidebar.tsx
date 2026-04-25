import { NavLink } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  Clock,
  BarChart2,
  Receipt,
  Briefcase,
} from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, enabled: true },
  { to: "/recruitment", label: "Recruitment", icon: Briefcase, enabled: true },
  { to: "/employees", label: "Employees", icon: Users, enabled: true },
  { to: "/attendance", label: "Attendance", icon: Clock, enabled: false },
  { to: "/performance", label: "Performance", icon: BarChart2, enabled: false },
  { to: "/expenses", label: "Expenses", icon: Receipt, enabled: false },
]

interface SidebarProps {
  open?: boolean
}

export function Sidebar({ open = true }: SidebarProps) {
  return (
    <aside
      className={cn(
        "bg-gray-900 text-gray-100 flex flex-col shrink-0 transition-all duration-300 overflow-hidden",
        open ? "w-56" : "w-0"
      )}
    >
      <div className="h-14 flex items-center px-4 border-b border-gray-800 shrink-0">
        <span className="font-bold text-white text-base tracking-tight whitespace-nowrap">ClientERP</span>
      </div>
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon, enabled }) =>
          enabled ? (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
                )
              }
            >
              <Icon size={16} />
              {label}
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
