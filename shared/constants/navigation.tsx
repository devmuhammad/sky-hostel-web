import { ReactNode } from "react";

export type StaffRole = "admin" | "super_admin" | "porter" | "other" | "security" | "cleaner" | "maintenance" | "front_desk" | "hostel_manager" | "accountant";

// We keep the old ones in the type to avoid breaking existing DB records immediately, but the new simplified ones are the primary focus.

export interface NavigationItem {
  name: string;
  href: string;
  icon: ReactNode;
  roles: StaffRole[];
}

// Dashboard icon
const DashboardIcon = (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2a2 2 0 01-2 2H10a2 2 0 01-2-2V5z"
    />
  </svg>
);

// Students icon
const StudentsIcon = (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
    />
  </svg>
);

// Payments icon
const PaymentsIcon = (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2.5 2.5 0 014 0z"
    />
  </svg>
);

// Rooms icon
const RoomsIcon = (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
    />
  </svg>
);

// Reports icon
const ReportsIcon = (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
);

// Admin Users icon
const AdminUsersIcon = (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
    />
  </svg>
);

// Inventory icon
const InventoryIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

// Daily Logs icon
const DailyLogsIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

// Leave Requests icon
const LeaveRequestsIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

// Support Tickets icon
const SupportTicketsIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 10h8M8 14h5m-8 7h14a2 2 0 002-2V7a2 2 0 00-2-2h-5l-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
    />
  </svg>
);

export const ADMIN_NAVIGATION: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: DashboardIcon,
    roles: ["admin", "super_admin", "hostel_manager", "accountant", "front_desk", "other"],
  },
  {
    name: "Students",
    href: "/admin/students",
    icon: StudentsIcon,
    roles: ["admin", "super_admin", "hostel_manager", "front_desk", "maintenance", "accountant", "porter", "other"],
  },
  {
    name: "Payments",
    href: "/admin/payments",
    icon: PaymentsIcon,
    roles: ["admin", "super_admin", "hostel_manager", "accountant", "other"],
  },
  {
    name: "Rooms",
    href: "/admin/rooms",
    icon: RoomsIcon,
    roles: ["admin", "super_admin", "hostel_manager", "maintenance", "cleaner", "porter", "other"],
  },
  {
    name: "Inventory",
    href: "/admin/inventory",
    icon: InventoryIcon,
    roles: ["admin", "super_admin", "porter", "other"],
  },
  {
    name: "Daily Logs",
    href: "/admin/daily-logs",
    icon: DailyLogsIcon,
    roles: ["admin", "super_admin", "hostel_manager", "front_desk", "security", "maintenance", "cleaner", "accountant", "porter", "other"],
  },
  {
    name: "Leave Requests",
    href: "/admin/leave-requests",
    icon: LeaveRequestsIcon,
    roles: ["admin", "super_admin", "hostel_manager", "front_desk", "security", "maintenance", "cleaner", "accountant", "porter", "other"],
  },
  {
    name: "Support Tickets",
    href: "/admin/student-tickets",
    icon: SupportTicketsIcon,
    roles: ["admin", "super_admin", "porter", "other"],
  },
  {
    name: "Reports",
    href: "/admin/reports",
    icon: ReportsIcon,
    roles: ["super_admin", "hostel_manager", "accountant", "other"],
  },
  {
    name: "Staff Management",
    href: "/admin/users",
    icon: AdminUsersIcon,
    roles: ["super_admin"],
  },
]; 
