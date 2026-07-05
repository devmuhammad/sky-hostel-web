import { NextResponse, NextRequest } from "next/server";

// Routes that should bounce to /sold-out when an admin has closed
// registration. Keep this list narrow — only the actual application/payment
// entry points, not the whole site.
const GATED_PATHS = ["/registration", "/invoice"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isGated = GATED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (!isGated) {
    return NextResponse.next();
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      // Missing config — fail open rather than block every applicant.
      return NextResponse.next();
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/app_settings?key=eq.registration_open&select=value`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
        cache: "no-store",
      }
    );

    if (response.ok) {
      const rows = (await response.json()) as { value: boolean }[];
      const isOpen = rows.length === 0 ? true : rows[0].value === true;

      if (!isOpen) {
        return NextResponse.redirect(new URL("/sold-out", request.url));
      }
    }
  } catch (error) {
    // Fail open on any network/config error — don't block real applicants
    // because of a transient issue. The payments API still enforces this
    // server-side as a second line of defense.
    console.error("Registration status middleware check failed:", error);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/registration/:path*", "/invoice/:path*"],
};
