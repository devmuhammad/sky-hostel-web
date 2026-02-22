"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClientSupabaseClient } from "@/shared/config/auth";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { ErrorAlert } from "@/shared/components/ui/error-alert";
import { LoadingButton } from "@/shared/components/ui/loading-button";
import { useToast } from "@/shared/hooks/useToast";

export default function StudentLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingLink, setIsSendingLink] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientSupabaseClient();
  const toast = useToast();

  useEffect(() => {
    const e = searchParams.get("error");
    if (e === "student_profile_not_found") {
      setError("Your account is authenticated but no student profile was found.");
    } else if (e === "magic_link_failed") {
      setError("Magic link verification failed. Please request a new link.");
    }
  }, [searchParams]);

  const handlePasswordLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      if (data.user) {
        toast.success("Login successful");
        router.push("/student");
        router.refresh();
      }
    } catch (err) {
      setError("Failed to log in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email.trim()) {
      setError("Enter your email to get a magic link");
      return;
    }

    setIsSendingLink(true);
    setError(null);

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/student`,
        },
      });

      if (otpError) {
        setError(otpError.message);
        return;
      }

      toast.success("Magic link sent", {
        description: "Check your email and open the link to complete login.",
      });
    } catch (err) {
      setError("Failed to send magic link");
    } finally {
      setIsSendingLink(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 px-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 left-1/2 h-64 w-64 -translate-x-[130%] rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-[-20%] rounded-full bg-sky-200/40 blur-3xl" />
      </div>

      <div className="relative mx-auto mt-16 flex min-h-[calc(100vh-64px)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full max-w-4xl grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="hidden lg:flex flex-col justify-center rounded-2xl border border-slate-200/70 bg-white/75 p-8 backdrop-blur">
            <span className="mb-4 inline-flex w-fit rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              Sky Hostel
            </span>
            <h1 className="text-4xl font-semibold leading-tight text-slate-900">
              Student Portal Access
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Login to view your profile, room assignment, payment history, and
              submit issues for porter support.
            </p>
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
              Track your ticket status from <span className="font-semibold text-slate-800">Open</span> to{" "}
              <span className="font-semibold text-slate-800">Resolved</span> in one place.
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/95 p-6 backdrop-blur sm:p-8">
            <div className="mb-7 text-center lg:text-left">
              <h2 className="text-3xl font-semibold text-slate-900">Student Portal</h2>
              <p className="mt-2 text-sm text-slate-600">
                Sign in to view your room, payments, and issue tickets.
              </p>
            </div>

            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <ErrorAlert error={error} />

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                  className="h-11 rounded-lg border-slate-300 bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                  className="h-11 rounded-lg border-slate-300 bg-white"
                />
              </div>

              <LoadingButton
                type="submit"
                isLoading={isLoading}
                loadingText="Signing in..."
                className="h-11 w-full rounded-lg bg-slate-900 text-white hover:bg-slate-800"
              >
                Sign In
              </LoadingButton>
            </form>

            <div className="my-5 border-t border-slate-200" />

            <Button
              type="button"
              variant="outline"
              disabled={isSendingLink}
              onClick={handleMagicLink}
              className="h-11 w-full rounded-lg border-slate-300"
            >
              {isSendingLink ? "Sending Link..." : "Send Magic Link Instead"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
