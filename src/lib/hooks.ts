import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { GhostProcess, Signal, Settings } from "@/lib/types";

export function useGhostProcesses() {
  return useQuery({
    queryKey: ["ghost_processes"],
    queryFn: async (): Promise<GhostProcess[]> => {
      const { data, error } = await supabase
        .from("ghost_processes")
        .select("*")
        .order("annual_cost", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useGhostProcess(id: string) {
  return useQuery({
    queryKey: ["ghost_processes", id],
    queryFn: async (): Promise<GhostProcess | null> => {
      const { data, error } = await supabase
        .from("ghost_processes")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useSignals(ids?: string[]) {
  return useQuery({
    queryKey: ["signals", ids],
    enabled: !!ids && ids.length > 0,
    queryFn: async (): Promise<Signal[]> => {
      if (!ids || !ids.length) return [];
      const { data, error } = await supabase
        .from("signals")
        .select("*")
        .in("id", ids);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async (): Promise<Settings | null> => {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useInvalidateGhost() {
  const qc = useQueryClient();
  return () =>
    qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === "ghost_processes" });
}

export { useMutation };
