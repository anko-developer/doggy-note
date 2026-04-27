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
      announcements: {
        Row: {
          body: string
          created_at: string | null
          daycare_id: string
          id: string
          published_at: string | null
          teacher_id: string
          title: string
        }
        Insert: {
          body: string
          created_at?: string | null
          daycare_id: string
          id?: string
          published_at?: string | null
          teacher_id: string
          title: string
        }
        Update: {
          body?: string
          created_at?: string | null
          daycare_id?: string
          id?: string
          published_at?: string | null
          teacher_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_daycare_id_fkey"
            columns: ["daycare_id"]
            isOneToOne: false
            referencedRelation: "daycares"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_reports: {
        Row: {
          ai_summary: string | null
          ai_summary_failed: boolean | null
          confirmed_at: string | null
          created_at: string | null
          date: string
          dog_id: string
          food_brand_today: string | null
          id: string
          meals_eaten: string | null
          mood: string | null
          published_at: string | null
          teacher_id: string
          teacher_note: string | null
          training_log: Json | null
          walk_count: number | null
          walk_distance_km: number | null
        }
        Insert: {
          ai_summary?: string | null
          ai_summary_failed?: boolean | null
          confirmed_at?: string | null
          created_at?: string | null
          date: string
          dog_id: string
          food_brand_today?: string | null
          id?: string
          meals_eaten?: string | null
          mood?: string | null
          published_at?: string | null
          teacher_id: string
          teacher_note?: string | null
          training_log?: Json | null
          walk_count?: number | null
          walk_distance_km?: number | null
        }
        Update: {
          ai_summary?: string | null
          ai_summary_failed?: boolean | null
          confirmed_at?: string | null
          created_at?: string | null
          date?: string
          dog_id?: string
          food_brand_today?: string | null
          id?: string
          meals_eaten?: string | null
          mood?: string | null
          published_at?: string | null
          teacher_id?: string
          teacher_note?: string | null
          training_log?: Json | null
          walk_count?: number | null
          walk_distance_km?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_reports_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
        ]
      }
      daycares: {
        Row: {
          created_at: string | null
          id: string
          join_code: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          join_code: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          join_code?: string
          name?: string
        }
        Relationships: []
      }
      dogs: {
        Row: {
          breed: string | null
          created_at: string | null
          daycare_id: string
          food_amount_per_meal: string | null
          food_brand: string | null
          id: string
          name: string
          owner_id: string | null
        }
        Insert: {
          breed?: string | null
          created_at?: string | null
          daycare_id: string
          food_amount_per_meal?: string | null
          food_brand?: string | null
          id?: string
          name: string
          owner_id?: string | null
        }
        Update: {
          breed?: string | null
          created_at?: string | null
          daycare_id?: string
          food_amount_per_meal?: string | null
          food_brand?: string | null
          id?: string
          name?: string
          owner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dogs_daycare_id_fkey"
            columns: ["daycare_id"]
            isOneToOne: false
            referencedRelation: "daycares"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          created_at: string | null
          daycare_id: string
          dog_id: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string | null
          daycare_id: string
          dog_id: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string | null
          daycare_id?: string
          dog_id?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invites_daycare_id_fkey"
            columns: ["daycare_id"]
            isOneToOne: false
            referencedRelation: "daycares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          created_at: string | null
          daycare_id: string
          entries: Json
          id: string
          week_start: string
        }
        Insert: {
          created_at?: string | null
          daycare_id: string
          entries?: Json
          id?: string
          week_start: string
        }
        Update: {
          created_at?: string | null
          daycare_id?: string
          entries?: Json
          id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plans_daycare_id_fkey"
            columns: ["daycare_id"]
            isOneToOne: false
            referencedRelation: "daycares"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          dog_id: string
          id: string
          teacher_id: string
        }
        Insert: {
          dog_id: string
          id?: string
          teacher_id: string
        }
        Update: {
          dog_id?: string
          id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          dog_id: string
          id: string
          report_id: string | null
          storage_path: string
          taken_at: string | null
        }
        Insert: {
          dog_id: string
          id?: string
          report_id?: string | null
          storage_path: string
          taken_at?: string | null
        }
        Update: {
          dog_id?: string
          id?: string
          report_id?: string | null
          storage_path?: string
          taken_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "photos_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "daily_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          created_at: string | null
          daycare_id: string
          description: string | null
          event_date: string
          id: string
          title: string
        }
        Insert: {
          created_at?: string | null
          daycare_id: string
          description?: string | null
          event_date: string
          id?: string
          title: string
        }
        Update: {
          created_at?: string | null
          daycare_id?: string
          description?: string | null
          event_date?: string
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_daycare_id_fkey"
            columns: ["daycare_id"]
            isOneToOne: false
            referencedRelation: "daycares"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string | null
          daycare_id: string | null
          display_name: string
          id: string
          role: string
        }
        Insert: {
          created_at?: string | null
          daycare_id?: string | null
          display_name: string
          id: string
          role: string
        }
        Update: {
          created_at?: string | null
          daycare_id?: string | null
          display_name?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_daycare_id_fkey"
            columns: ["daycare_id"]
            isOneToOne: false
            referencedRelation: "daycares"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invite: { Args: { p_token: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
