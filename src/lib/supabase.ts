import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ytxtyphbguszjndtpakm.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_NCILoAG5w2kh9ciKd3QM8w_TTUfHkC4";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export const isSupabaseConfigured = true;
