"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClientSupabaseClient } from "@/shared/config/auth";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useToast } from "@/shared/hooks/useToast";
import { useAppStore } from "@/shared/store/appStore";
import { ADMIN_NAVIGATION } from "@/shared/constants/navigation";

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
  const { setCurrentUser, setAllData, sidebarCollapsed, setSidebarCollapsed } =
    useAppStore();

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

  // Cleanup effect to reset loading state on unmount
  useEffect(() => {
    return () => {
      setIsSigningOut(false);
    };
  }, []);

  const handleSignOut = async () => {
    if (isSigningOut) return; // Prevent multiple clicks

    try {
      setIsSigningOut(true);
      const { error } = await supabase.auth.signOut();

      if (error) {
        toast.error("Error signing out", {
          description: error.message,
        });
        return;
      }

      // Clear app state
      setCurrentUser(null);
      setAllData({
        students: [],
        payments: [],
        rooms: [],
        adminUsers: [],
      });

      // Redirect to login
      router.push("/login");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Error signing out", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div
      className={cn(
        "fixed lg:relative flex flex-col h-full bg-white border-r border-gray-200 shadow-sm transition-all duration-300 z-40",
        // Mobile: slide in from left when open (sidebarCollapsed = true means open on mobile)
        sidebarCollapsed
          ? "translate-x-0 w-64"
          : "-translate-x-full w-64 lg:translate-x-0",
        // Desktop: use local collapsed state
        "lg:translate-x-0",
        isCollapsed ? "lg:w-16" : "lg:w-64",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {(!isCollapsed || sidebarCollapsed) && (
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
            <div className="lg:block">
              <h1 className="text-sm font-semibold text-gray-900">
                Sky Hostel
              </h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>
        )}

        <div className="flex items-center space-x-2">
          {/* Mobile Close Button */}
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Desktop Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:block p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
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
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {ADMIN_NAVIGATION.map((item) => {
          const isActive = pathname === item.href;
          const isVisible = item.roles.includes(adminUser?.role || "admin");
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => {
                // Close mobile sidebar when clicking a link
                if (sidebarCollapsed) {
                  setSidebarCollapsed(false);
                }
              }}
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                isActive
                  ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                !isCollapsed || sidebarCollapsed ? "" : "justify-center",
                !isVisible && "hidden" // Hide items not visible to the user
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
              {(!isCollapsed || sidebarCollapsed) && (
                <span className="truncate">{item.name}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200">
        <div
          className={cn(
            "flex items-center space-x-3",
            !isCollapsed || sidebarCollapsed ? "" : "justify-center"
          )}
        >
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-blue-600">
              {adminUser ? adminUser.first_name.charAt(0) : "A"}
            </span>
          </div>
          {(!isCollapsed || sidebarCollapsed) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {adminUser
                  ? `${adminUser.first_name} ${adminUser.last_name}`
                  : "Admin User"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {adminUser?.role === "super_admin" ? "Super Admin" : "Admin"}
              </p>
            </div>
          )}
          {(!isCollapsed || sidebarCollapsed) && (
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              title="Sign out"
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
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
