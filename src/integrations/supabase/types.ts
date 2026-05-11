export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ghost_processes: {
        Row: {
          annual_cost: number
          category: Database["public"]["Enums"]["ghost_category"]
          confidence: string
          created_at: string
          description: string | null
          difficulty: number
          evidence: Json
          hours_per_occurrence: number
          id: string
          implementation_days: number | null
          monthly_cost: number
          monthly_hours: number | null
          name: string
          occurrences_per_month: number
          owner: string | null
          people_involved: number
          recommendation: string | null
          recommended_tools: string | null
          signal_ids: string[]
          source: Database["public"]["Enums"]["ghost_source"]
          status: Database["public"]["Enums"]["ghost_status"]
          team: string | null
          updated_at: string
        }
        Insert: {
          annual_cost?: number
          category?: Database["public"]["Enums"]["ghost_category"]
          confidence?: string
          created_at?: string
          description?: string | null
          difficulty?: number
          evidence?: Json
          hours_per_occurrence?: number
          id?: string
          implementation_days?: number | null
          monthly_cost?: number
          monthly_hours?: number | null
          name: string
          occurrences_per_month?: number
          owner?: string | null
          people_involved?: number
          recommendation?: string | null
          recommended_tools?: string | null
          signal_ids?: string[]
          source?: Database["public"]["Enums"]["ghost_source"]
          status?: Database["public"]["Enums"]["ghost_status"]
          team?: string | null
          updated_at?: string
        }
        Update: {
          annual_cost?: number
          category?: Database["public"]["Enums"]["ghost_category"]
          confidence?: string
          created_at?: string
          description?: string | null
          difficulty?: number
          evidence?: Json
          hours_per_occurrence?: number
          id?: string
          implementation_days?: number | null
          monthly_cost?: number
          monthly_hours?: number | null
          name?: string
          occurrences_per_month?: number
          owner?: string | null
          people_involved?: number
          recommendation?: string | null
          recommended_tools?: string | null
          signal_ids?: string[]
          source?: Database["public"]["Enums"]["ghost_source"]
          status?: Database["public"]["Enums"]["ghost_status"]
          team?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          blended_hourly_rate: number
          id: number
          updated_at: string
        }
        Insert: {
          blended_hourly_rate?: number
          id?: number
          updated_at?: string
        }
        Update: {
          blended_hourly_rate?: number
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      signals: {
        Row: {
          fetched_at: string
          id: string
          metadata: Json
          signal_type: string
          source: Database["public"]["Enums"]["signal_source"]
          title: string | null
        }
        Insert: {
          fetched_at?: string
          id?: string
          metadata?: Json
          signal_type: string
          source: Database["public"]["Enums"]["signal_source"]
          title?: string | null
        }
        Update: {
          fetched_at?: string
          id?: string
          metadata?: Json
          signal_type?: string
          source?: Database["public"]["Enums"]["signal_source"]
          title?: string | null
        }
        Relationships: []
      }
      submissions: {
        Row: {
          anonymous: boolean
          created_at: string
          frequency: string
          ghost_process_id: string | null
          hours: number
          id: string
          missing_tool: string | null
          people: number
          reporter_name: string | null
          task_name: string
          team: string | null
        }
        Insert: {
          anonymous?: boolean
          created_at?: string
          frequency: string
          ghost_process_id?: string | null
          hours: number
          id?: string
          missing_tool?: string | null
          people?: number
          reporter_name?: string | null
          task_name: string
          team?: string | null
        }
        Update: {
          anonymous?: boolean
          created_at?: string
          frequency?: string
          ghost_process_id?: string | null
          hours?: number
          id?: string
          missing_tool?: string | null
          people?: number
          reporter_name?: string | null
          task_name?: string
          team?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_ghost_process_id_fkey"
            columns: ["ghost_process_id"]
            isOneToOne: false
            referencedRelation: "ghost_processes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      ghost_category:
        | "Data Wrangling"
        | "Manual Reporting"
        | "Improvised Approval Workflow"
        | "Knowledge Retrieval"
        | "System Sync"
        | "Other"
      ghost_source: "detected" | "reported"
      ghost_status:
        | "detected"
        | "acknowledged"
        | "in_progress"
        | "fixed"
        | "false_positive"
      signal_source: "calendar" | "gmail" | "drive" | "slack" | "manual"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ghost_category: [
        "Data Wrangling",
        "Manual Reporting",
        "Improvised Approval Workflow",
        "Knowledge Retrieval",
        "System Sync",
        "Other",
      ],
      ghost_source: ["detected", "reported"],
      ghost_status: [
        "detected",
        "acknowledged",
        "in_progress",
        "fixed",
        "false_positive",
      ],
      signal_source: ["calendar", "gmail", "drive", "slack", "manual"],
    },
  },
} as const
