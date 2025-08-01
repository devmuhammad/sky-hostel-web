"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/shared/store/appStore";
import { useAppData } from "@/shared/hooks/useAppData";
import { createClientSupabaseClient } from "@/shared/config/auth";

interface DataInitializerProps {
  children: React.ReactNode;
}

export default function DataInitializer({ children }: DataInitializerProps) {
  const { currentUser, setCurrentUser, setLoading } = useAppStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const supabase = createClientSupabaseClient();
  
  // Only use useAppData when there's a current user
  const { isLoading, refetch } = useAppData();

  useEffect(() => {
    const initializeData = async () => {
      try {
        // Check if user is authenticated
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          // Check if user is an admin
          const { data: adminUser, error } = await supabase
            .from("admin_users")
            .select("*")
            .eq("email", session.user.email)
            .eq("is_active", true)
            .single();

          if (adminUser && !error) {
            setCurrentUser(adminUser);
            setLoading("dashboard", true);
            
            // Only initialize data for admin users
            // The actual data fetching will be handled by the dashboard components
            // when they mount and detect the currentUser
          } else {
            setCurrentUser(null);
            setLoading("dashboard", false);
          }
        } else {
          setCurrentUser(null);
          setLoading("dashboard", false);
        }
      } catch (error) {
        console.error("Error initializing data:", error);
        setCurrentUser(null);
        setLoading("dashboard", false);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeData();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        const { data: adminUser, error } = await supabase
          .from("admin_users")
          .select("*")
          .eq("email", session.user.email)
          .eq("is_active", true)
          .single();

        if (adminUser && !error) {
          setCurrentUser(adminUser);
          setLoading("dashboard", true);
        } else {
          setCurrentUser(null);
          setLoading("dashboard", false);
        }
      } else if (event === "SIGNED_OUT") {
        setCurrentUser(null);
        setLoading("dashboard", false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, setCurrentUser, setLoading]);

  // Set up background refresh every 5 minutes for admin users
  useEffect(() => {
    if (currentUser) {
      const interval = setInterval(
        () => {
          refetch();
        },
        5 * 60 * 1000
      ); // 5 minutes

      return () => clearInterval(interval);
    }
  }, [currentUser, refetch]);

  // Update loading state based on useAppData
  useEffect(() => {
    if (currentUser) {
      setLoading("dashboard", isLoading);
    }
  }, [isLoading, setLoading, currentUser]);

  // Don't render children until initialization is complete
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
