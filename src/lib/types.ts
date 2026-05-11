import { Database } from "@/integrations/supabase/types";

export type GhostProcess = Database["public"]["Tables"]["ghost_processes"]["Row"];
export type Signal = Database["public"]["Tables"]["signals"]["Row"];
export type Settings = Database["public"]["Tables"]["settings"]["Row"];
