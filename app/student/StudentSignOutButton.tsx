"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientSupabaseClient } from "@/shared/config/auth";
import { Button } from "@/shared/components/ui/button";

export default function StudentSignOutButton() {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);

    const supabase = createClientSupabaseClient();
    await supabase.auth.signOut();

    router.push("/student/login");
    router.refresh();
    setIsSigningOut(false);
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleSignOut}
      disabled={isSigningOut}
      className="rounded-lg"
    >
      {isSigningOut ? "Signing out..." : "Sign out"}
    </Button>
  );
}
