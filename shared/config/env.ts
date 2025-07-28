import { z } from "zod";

// Define required environment variables schema
const envSchema = z.object({
  // Supabase (always required)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Invalid Supabase URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "Supabase anon key is required"),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "Supabase service role key is required"),

  // Paycashless (optional in development)
  PAYCASHLESS_API_KEY: z.string().optional(),
  PAYCASHLESS_API_SECRET: z.string().optional(),
  PAYCASHLESS_API_URL: z.string().url().optional(),

  // Resend (optional in development)
  RESEND_API_KEY: z.string().optional(),

  // App (with development fallback)
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),

  // Node environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

// Validate environment variables
function validateEnv() {
  try {
    const parsed = envSchema.parse(process.env);

    // Additional validation for production
    if (parsed.NODE_ENV === "production") {
      const productionRequired = [
        "PAYCASHLESS_API_KEY",
        "PAYCASHLESS_API_SECRET",
        "NEXT_PUBLIC_APP_URL",
        "RESEND_API_KEY",
      ];

      const missing = productionRequired.filter((key) => !process.env[key]);
      if (missing.length > 0) {
        throw new Error(
          `Production deployment missing required variables: ${missing.join(", ")}`
        );
      }
    }

    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map(
        (err) => `${err.path.join(".")}: ${err.message}`
      );

      // In development, show warning instead of crashing
      if (process.env.NODE_ENV !== "production") {
        console.warn("⚠️  Environment variable warnings:");
        console.warn(missingVars.join("\n"));
        console.warn(
          "Some features may not work without proper configuration."
        );

        // Try to continue with available env vars but provide sensible defaults
        const envWithDefaults = {
          ...process.env,
          NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
          NEXT_PUBLIC_SUPABASE_ANON_KEY:
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
          SUPABASE_SERVICE_ROLE_KEY:
            process.env.SUPABASE_SERVICE_ROLE_KEY || "",

          NODE_ENV: process.env.NODE_ENV || "development",
        };

        // Try parsing again with the available env vars
        try {
          return envSchema.parse(envWithDefaults);
        } catch {
          // If still failing, throw the original error
          throw new Error(
            `Missing required environment variables:\n${missingVars.join("\n")}\n\nPlease check your .env.local file.`
          );
        }
      }

      throw new Error(
        `Missing or invalid environment variables:\n${missingVars.join("\n")}\n\nPlease check your .env.local file.`
      );
    }
    throw error;
  }
}

// Export validated environment variables
export const env = validateEnv();

// Helper to check if we're in production
export const isProduction = env.NODE_ENV === "production";
export const isDevelopment = env.NODE_ENV === "development";
export const isTest = env.NODE_ENV === "test";

// Export individual env vars with validation
export const supabaseConfig = {
  url: env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
};

export const paycashlessConfig = {
  apiKey: env.PAYCASHLESS_API_KEY || "",
  apiSecret: env.PAYCASHLESS_API_SECRET || "",
  apiUrl: env.PAYCASHLESS_API_URL || "https://api.paycashless.com",
};

export const appConfig = {
  url: env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
};
