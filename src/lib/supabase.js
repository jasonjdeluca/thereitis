import { createClient } from "@supabase/supabase-js";

// Single shared client for the whole app. Auth uses the library's built-in
// token management: ONE client, autoRefreshToken with its internal single-flight
// lock, and no manual refresh calls anywhere else. Earlier code disabled
// autoRefresh and called refreshSession() before every admin write, which —
// combined with onAuthStateChange's internal session load — fired several
// concurrent refreshes on the same (often expired) token and tripped the
// /auth/v1/token 429 rate limit, which auth-js turns into a SIGNED_OUT login
// loop. Letting the library own refresh, with exactly one load path, prevents
// the storm: the single-flight lock collapses concurrent refreshes into one.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  },
);
