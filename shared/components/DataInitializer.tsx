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
        // Set initial loading state
        setLoading("dashboard", true);
        
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
            
            // Preload all data with better error handling
            try {
              await refetch();
            } catch (refetchError) {
              console.error("Error refetching data:", refetchError);
              // Don't fail completely if refetch fails
            }
          } else {
            setLoading("dashboard", false);
          }
        } else {
          setLoading("dashboard", false);
        }
      } catch (error) {
        console.error("Error initializing data:", error);
        setLoading("dashboard", false);
      }
    };

    initializeData();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        setLoading("dashboard", true);
        
        const { data: adminUser, error } = await supabase
          .from("admin_users")
          .select("*")
          .eq("email", session.user.email)
          .eq("is_active", true)
          .single();

        if (adminUser && !error) {
          setCurrentUser(adminUser);
          try {
            await refetch();
          } catch (refetchError) {
            console.error("Error refetching data on sign in:", refetchError);
            setLoading("dashboard", false);
          }
        } else {
          setLoading("dashboard", false);
        }
      } else if (event === "SIGNED_OUT") {
        setCurrentUser(null);
        setLoading("dashboard", false);
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

  // Update loading state based on useAppData
  useEffect(() => {
    setLoading("dashboard", isLoading);
  }, [isLoading, setLoading]);

  return <>{children}</>;
}
