"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClientSupabaseClient } from "@/shared/config/auth";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useToast } from "@/shared/hooks/useToast";
import { useAppStore } from "@/shared/store/appStore";

interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "admin" | "super_admin";
  is_active: boolean;
  last_login?: string;
}

interface SidebarProps {
  className?: string;
  adminUser?: AdminUser | null;
}

const navigation = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: (
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
    ),
  },
  {
    name: "Students",
    href: "/admin/students",
    icon: (
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
    ),
  },
  {
    name: "Payments",
    href: "/admin/payments",
    icon: (
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
    ),
  },
  {
    name: "Rooms",
    href: "/admin/rooms",
    icon: (
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
    ),
  },
  {
    name: "Reports",
    href: "/admin/reports",
    icon: (
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
    ),
  },
  {
    name: "Admin Users",
    href: "/admin/users",
    icon: (
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
    ),
  },
];

export default function Sidebar({
  className,
}: Omit<SidebarProps, "adminUser">) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClientSupabaseClient();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const toast = useToast();
  const { setCurrentUser, setAllData } = useAppStore();

  // Fetch admin user data
  useEffect(() => {
    const fetchAdminUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user?.email) {
          const { data: adminData, error } = await supabase
            .from("admin_users")
            .select("*")
            .eq("email", session.user.email)
            .eq("is_active", true)
            .single();

          if (adminData && !error) {
            setAdminUser(adminData);
          }
        }
      } catch (error) {
        console.error("Error fetching admin user:", error);
      }
    };

    fetchAdminUser();
  }, [supabase]);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);

      // Clear the store data
      setCurrentUser(null);
      setAllData({
        students: [],
        payments: [],
        rooms: [],
        adminUsers: [],
      });

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Sign out error:", error);
        toast.error("Failed to sign out. Please try again.");
        return;
      }

      // Show success message
      toast.success("Signed out successfully");

      // Redirect to login page
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-white border-r border-gray-200 shadow-sm transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
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
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900">
                Sky Hostel
              </h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg
            className="w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                isActive
                  ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                isCollapsed && "justify-center"
              )}
            >
              <span
                className={cn(
                  "flex-shrink-0",
                  isActive
                    ? "text-blue-700"
                    : "text-gray-400 group-hover:text-gray-600"
                )}
              >
                {item.icon}
              </span>
              {!isCollapsed && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200">
        <div
          className={cn(
            "flex items-center space-x-3",
            isCollapsed && "justify-center"
          )}
        >
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-blue-600">
              {adminUser ? adminUser.first_name.charAt(0) : "A"}
            </span>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {adminUser
                  ? `${adminUser.first_name} ${adminUser.last_name}`
                  : "Admin User"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {adminUser ? adminUser.email : "admin@skyhotel.com"}
              </p>
              {adminUser && (
                <p className="text-xs text-blue-600 font-medium capitalize">
                  {adminUser.role.replace("_", " ")}
                </p>
              )}
            </div>
          )}
        </div>

        {!isCollapsed && (
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="mt-3 w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSigningOut ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>Signing Out...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span>Sign Out</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
