import { createServerClient } from "@supabase/ssr";
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Server-side client for server components and API routes
export const createServerSupabaseClient = async () => {
  // Import cookies only when needed in server context
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
};

// Client-side client for client components
export const createClientSupabaseClient = () => {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};

// Admin authentication utilities
export const checkAdminAccess = async () => {
  const supabase = await createServerSupabaseClient();

  // Get the current session
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return { isAdmin: false, adminUser: null, error: "No session found" };
  }

  // Check if user exists in admin_users table
  const { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .select("*")
    .eq("email", session.user.email)
    .eq("is_active", true)
    .single();

  if (adminError || !adminUser) {
    return { isAdmin: false, adminUser: null, error: "Not an admin user" };
  }

  // Update last login
  await supabase
    .from("admin_users")
    .update({ last_login: new Date().toISOString() })
    .eq("id", adminUser.id);

  return { isAdmin: true, adminUser, error: null };
};

export const requireAdminAccess = async () => {
  const { isAdmin, adminUser, error } = await checkAdminAccess();

  if (!isAdmin) {
    throw new Error(error || "Admin access required");
  }

  return adminUser;
};
