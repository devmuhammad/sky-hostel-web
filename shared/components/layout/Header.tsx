"use client";

import Link from "next/link";
import Image from "next/image";
import { createClientSupabaseClient } from "@/shared/config/auth";
import { useEffect, useState } from "react";
import { useAppStore } from "@/shared/store/appStore";

interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

const Header = () => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientSupabaseClient();
  const { currentUser } = useAppStore();

  useEffect(() => {
    const checkAdminSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          // Check if user is an admin
          const { data: adminData, error } = await supabase
            .from("admin_users")
            .select("*")
            .eq("email", session.user.email)
            .eq("is_active", true)
            .single();

          if (adminData && !error) {
            setAdminUser(adminData);
          } else {
            setAdminUser(null);
          }
        } else {
          setAdminUser(null);
        }
      } catch (error) {
        console.error("Error checking admin session:", error);
        setAdminUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        const { data: adminData, error } = await supabase
          .from("admin_users")
          .select("*")
          .eq("email", session.user.email)
          .eq("is_active", true)
          .single();

        if (adminData && !error) {
          setAdminUser(adminData);
        } else {
          setAdminUser(null);
        }
      } else if (event === "SIGNED_OUT") {
        setAdminUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Use the store's currentUser as a fallback, but only if we have a valid session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && currentUser && !adminUser) {
        setAdminUser(currentUser);
      } else if (!session) {
        setAdminUser(null);
      }
    };
    
    checkSession();
  }, [currentUser, adminUser, supabase]);

  // Determine which user data to display
  const displayUser = adminUser;

  return (
    <header className="py-4 px-6 bg-white transition-all duration-300 z-10 fixed top-0 right-0 w-full border-b border-gray-200">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-1">
          <Image src="/logo.png" alt="Sky Hostel" width={100} height={100} />
        </Link>
        <div className="flex items-center space-x-4">
          {!isLoading && (
            <>
              {displayUser ? (
                <Link
                  href="/admin"
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {displayUser.first_name.charAt(0)}
                    </span>
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-sm font-medium text-gray-900">
                      {displayUser.first_name} {displayUser.last_name}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {displayUser.role.replace("_", " ")}
                    </div>
                  </div>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="text-[--sky-blue] hover:text-[--sky-dark-blue] transition-colors"
                >
                  Admin
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
