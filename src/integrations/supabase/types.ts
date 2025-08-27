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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      api_tokens: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          last_used_at: string | null
          permissions: string[]
          token_hash: string
          token_name: string
          token_prefix: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          permissions?: string[]
          token_hash: string
          token_name: string
          token_prefix: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          permissions?: string[]
          token_hash?: string
          token_name?: string
          token_prefix?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      keep_alive: {
        Row: {
          id: number
          last_ping_time: string
          ping_count: number
        }
        Insert: {
          id?: number
          last_ping_time?: string
          ping_count?: number
        }
        Update: {
          id?: number
          last_ping_time?: string
          ping_count?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          price: number
          status: string
          stock: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          price: number
          status?: string
          stock?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          status?: string
          stock?: number
          updated_at?: string
        }
        Relationships: []
      }
      profile_access_log: {
        Row: {
          access_type: string
          accessed_at: string
          accessed_user_id: string
          accessor_user_id: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
        }
        Insert: {
          access_type: string
          accessed_at?: string
          accessed_user_id: string
          accessor_user_id: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Update: {
          access_type?: string
          accessed_at?: string
          accessed_user_id?: string
          accessor_user_id?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"]
          approved_at: string | null
          approved_by: string | null
          cpf: string
          created_at: string
          full_name: string
          id: string
          rejected_reason: string | null
          role: string
          updated_at: string
          user_id: string
          user_role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          cpf: string
          created_at?: string
          full_name: string
          id?: string
          rejected_reason?: string | null
          role?: string
          updated_at?: string
          user_id: string
          user_role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          cpf?: string
          created_at?: string
          full_name?: string
          id?: string
          rejected_reason?: string | null
          role?: string
          updated_at?: string
          user_id?: string
          user_role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles_secure"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      profiles_secure: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"] | null
          approved_at: string | null
          approved_by: string | null
          cpf_display: string | null
          cpf_masked: boolean | null
          created_at: string | null
          full_name: string | null
          id: string | null
          rejected_reason: string | null
          updated_at: string | null
          user_id: string | null
          user_role: Database["public"]["Enums"]["user_role"] | null
        }
        Insert: {
          approval_status?:
            | Database["public"]["Enums"]["approval_status"]
            | null
          approved_at?: string | null
          approved_by?: string | null
          cpf_display?: never
          cpf_masked?: never
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          rejected_reason?: string | null
          updated_at?: string | null
          user_id?: string | null
          user_role?: Database["public"]["Enums"]["user_role"] | null
        }
        Update: {
          approval_status?:
            | Database["public"]["Enums"]["approval_status"]
            | null
          approved_at?: string | null
          approved_by?: string | null
          cpf_display?: never
          cpf_masked?: never
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          rejected_reason?: string | null
          updated_at?: string | null
          user_id?: string | null
          user_role?: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles_secure"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_change_user_role: {
        Args: {
          new_role: Database["public"]["Enums"]["user_role"]
          target_user_id: string
        }
        Returns: boolean
      }
      admin_get_profile: {
        Args: { target_user_id: string }
        Returns: {
          approval_status: Database["public"]["Enums"]["approval_status"]
          approved_at: string | null
          approved_by: string | null
          cpf: string
          created_at: string
          full_name: string
          id: string
          rejected_reason: string | null
          role: string
          updated_at: string
          user_id: string
          user_role: Database["public"]["Enums"]["user_role"]
        }[]
      }
      admin_list_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          approval_status: Database["public"]["Enums"]["approval_status"]
          approved_at: string
          approved_by: string
          cpf_masked: string
          created_at: string
          full_name: string
          id: string
          updated_at: string
          user_id: string
          user_role: Database["public"]["Enums"]["user_role"]
        }[]
      }
      approve_user: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      can_view_full_cpf: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      check_profiles_anonymous_access: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      get_profile_safe: {
        Args: { target_user_id?: string }
        Returns: {
          approval_status: Database["public"]["Enums"]["approval_status"]
          approved_at: string
          approved_by: string
          cpf_display: string
          cpf_masked: boolean
          created_at: string
          full_name: string
          id: string
          updated_at: string
          user_id: string
          user_role: Database["public"]["Enums"]["user_role"]
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: string
      }
      is_authenticated_and_approved: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_superadmin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_user_approved: {
        Args: { user_id: string }
        Returns: boolean
      }
      log_profile_access: {
        Args: { access_type: string; accessed_user_id: string }
        Returns: undefined
      }
      mask_cpf: {
        Args: { cpf_value: string }
        Returns: string
      }
      reject_user: {
        Args: { reason?: string; target_user_id: string }
        Returns: boolean
      }
      superadmin_access_profile: {
        Args: { access_reason: string; target_user_id: string }
        Returns: {
          approval_status: Database["public"]["Enums"]["approval_status"]
          approved_at: string
          approved_by: string
          cpf_display: string
          created_at: string
          full_name: string
          id: string
          updated_at: string
          user_id: string
          user_role: Database["public"]["Enums"]["user_role"]
        }[]
      }
      superadmin_list_profiles: {
        Args: { access_reason: string }
        Returns: {
          approval_status: Database["public"]["Enums"]["approval_status"]
          approved_at: string
          approved_by: string
          cpf_masked: string
          created_at: string
          full_name: string
          id: string
          updated_at: string
          user_id: string
          user_role: Database["public"]["Enums"]["user_role"]
        }[]
      }
      update_profile_safe: {
        Args: {
          new_cpf?: string
          new_full_name?: string
          target_user_id: string
        }
        Returns: boolean
      }
      validate_security_posture: {
        Args: Record<PropertyKey, never>
        Returns: {
          description: string
          security_check: string
          status: string
        }[]
      }
      verify_profile_security: {
        Args: Record<PropertyKey, never>
        Returns: {
          check_name: string
          details: string
          status: string
        }[]
      }
    }
    Enums: {
      approval_status: "pending" | "approved" | "rejected"
      user_role: "superadmin" | "admin" | "user"
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
      approval_status: ["pending", "approved", "rejected"],
      user_role: ["superadmin", "admin", "user"],
    },
  },
} as const
