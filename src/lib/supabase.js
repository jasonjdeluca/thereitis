import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      // Do NOT auto-refresh tokens in the background. On client init Supabase
      // refreshes any stored-but-expired token; when that refresh endpoint
      // rate-limits (HTTP 429) the library fires SIGNED_OUT and bounces the
      // admin to the login screen on every page load. We refresh explicitly
      // right before each admin write instead (see approveRow in Admin.jsx).
      autoRefreshToken: false,
      persistSession: true,
    },
  },
);
