import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://hlrmkwvcyzrnbglgbvxm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhscm1rd3ZjeXpybmJnbGdidnhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNDYzMDUsImV4cCI6MjA4NzgyMjMwNX0.IJCuajeYPyTWQfo0TWBqOPGLxt3qlwKXr5k9NFtD-BY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
