"use client";

import { useEffect } from "react";
import { useAppStore } from "@/shared/store/appStore";
import { useAppData } from "@/shared/hooks/useAppData";
import { createClientSupabaseClient } from "@/shared/config/auth";

interface DataInitializerProps {
  children: React.ReactNode;
}

export default function DataInitializer({ children }: DataInitializerProps) {
  const { currentUser, setCurrentUser, setLoading } = useAppStore();
  const { isLoading, refetch } = useAppData();
  const supabase = createClientSupabaseClient();

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

            // Preload all data
            await refetch();
          }
        }
      } catch (error) {
        console.error("Error initializing data:", error);
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
          await refetch();
        }
      } else if (event === "SIGNED_OUT") {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, setCurrentUser, setLoading, refetch]);

  // Set up background refresh every 5 minutes
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

  return <>{children}</>;
}
