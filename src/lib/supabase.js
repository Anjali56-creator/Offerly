import { createClient } from "@supabase/supabase-js";

// both values come from the .env file (see .env.example)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// null when the keys are missing, so the app can show a clear message
// instead of crashing
export const supabase = supabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;
