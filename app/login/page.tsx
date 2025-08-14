"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClientSupabaseClient } from "@/shared/config/auth";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { ErrorAlert } from "@/shared/components/ui/error-alert";
import { LoadingButton } from "@/shared/components/ui/loading-button";
import { useToast } from "@/shared/hooks/useToast";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientSupabaseClient();
  const toast = useToast();

  useEffect(() => {
    // Check for error messages in URL params
    const errorParam = searchParams.get("error");
    if (errorParam === "admin_access_required") {
      setError(
        "You need admin privileges to access the dashboard. Please contact your administrator."
      );
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Login attempt logged

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // Sign in result processed

      if (error) {
        // Sign in error occurred
        setError(error.message);
        toast.error("Login failed. Please check your credentials.");
      } else if (data.user) {
        // User authenticated, checking admin status

        // Check if user is an admin
        const { data: adminUser, error: adminError } = await supabase
          .from("admin_users")
          .select("*")
          .eq("email", data.user.email)
          .eq("is_active", true)
          .single();

        // Admin check completed
          adminUser: !!adminUser,
          error: adminError?.message,
        });

        if (adminError || !adminUser) {
          // Admin check failed
          setError(
            "You don't have admin privileges. Please contact your administrator."
          );
          toast.error("Access denied. You don't have admin privileges.");
          // Sign out the user since they're not an admin
          await supabase.auth.signOut();
        } else {
          // Admin check successful, redirecting

          // Show success message
          toast.success(`Welcome back, ${adminUser.first_name}!`);

          // Get the redirect URL from query params or default to admin
          const urlParams = new URLSearchParams(window.location.search);
          const redirectTo = urlParams.get("redirectedFrom") || "/admin";
          // Redirecting to admin dashboard
          router.push(redirectTo);
          router.refresh();
        }
      }
    } catch (err) {
      // Login error occurred
      setError("An unexpected error occurred");
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
            <svg
              className="h-6 w-6 text-white"
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
          <h1 className="text-3xl font-bold text-gray-900">
            Sky Student Hostel
          </h1>
          <p className="text-gray-600 mt-2">Admin Dashboard Login</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          <form onSubmit={handleLogin} className="space-y-6">
            <ErrorAlert error={error} />

            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@skyhotel.com"
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <LoadingButton
              type="submit"
              isLoading={isLoading}
              loadingText="Signing in..."
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Sign In to Dashboard
            </LoadingButton>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">Secure admin access only</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            © 2024 Sky Student Hostel. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
