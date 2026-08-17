import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://avwcfzapsgvqftwpbuwv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_fiZ27z87dF5ZbZTZXJiX_g_01-cPtcM";

export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);