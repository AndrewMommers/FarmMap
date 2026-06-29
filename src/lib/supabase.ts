import { createClient } from '@supabase/supabase-js';

// Values are empty strings if env vars are missing – the app will surface
// a clear runtime error rather than a cryptic crash.
const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string ?? '';
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string ?? '';

export const supabase = createClient(supabaseUrl, supabaseKey);
