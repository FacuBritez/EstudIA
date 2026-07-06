import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://htpymrlakgnwoihcewxw.supabase.co";
const supabaseKey = "sb_publishable_MFuEgk3qMEcI9YNaXP9OmA_13fvJ2Gg";

export const supabase = createClient(supabaseUrl, supabaseKey);