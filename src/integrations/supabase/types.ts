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
      admin_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          account_name: string
          account_number: string
          bank_code: string | null
          bank_name: string
          created_at: string
          id: string
          is_default: boolean
          user_id: string
        }
        Insert: {
          account_name: string
          account_number: string
          bank_code?: string | null
          bank_name: string
          created_at?: string
          id?: string
          is_default?: boolean
          user_id: string
        }
        Update: {
          account_name?: string
          account_number?: string
          bank_code?: string | null
          bank_name?: string
          created_at?: string
          id?: string
          is_default?: boolean
          user_id?: string
        }
        Relationships: []
      }
      campaign_banners: {
        Row: {
          created_at: string
          ends_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          link: string | null
          sort_order: number
          starts_at: string | null
          subtitle: string | null
          title: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link?: string | null
          sort_order?: number
          starts_at?: string | null
          subtitle?: string | null
          title?: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link?: string | null
          sort_order?: number
          starts_at?: string | null
          subtitle?: string | null
          title?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          body: string | null
          created_at: string
          id: string
          image_path: string | null
          read_at: string | null
          sender_id: string
          sender_role: Database["public"]["Enums"]["app_role"]
          thread_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          image_path?: string | null
          read_at?: string | null
          sender_id: string
          sender_role?: Database["public"]["Enums"]["app_role"]
          thread_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          image_path?: string | null
          read_at?: string | null
          sender_id?: string
          sender_role?: Database["public"]["Enums"]["app_role"]
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          trade_id: string | null
          unread_for_admin: number
          unread_for_user: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          trade_id?: string | null
          unread_for_admin?: number
          unread_for_user?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          trade_id?: string | null
          unread_for_admin?: number
          unread_for_user?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_threads_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_card_brands: {
        Row: {
          accent_color: string | null
          created_at: string
          id: string
          is_visible: boolean
          logo_url: string | null
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          created_at?: string
          id?: string
          is_visible?: boolean
          logo_url?: string | null
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          created_at?: string
          id?: string
          is_visible?: boolean
          logo_url?: string | null
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      gift_card_regions: {
        Row: {
          code: string
          currency: string
          flag_emoji: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number
        }
        Insert: {
          code: string
          currency?: string
          flag_emoji?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          code?: string
          currency?: string
          flag_emoji?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      gift_card_variants: {
        Row: {
          brand_id: string
          card_type: Database["public"]["Enums"]["card_type"]
          created_at: string
          id: string
          is_active: boolean
          max_value: number
          min_value: number
          rate_naira: number
          region_id: string
          updated_at: string
        }
        Insert: {
          brand_id: string
          card_type: Database["public"]["Enums"]["card_type"]
          created_at?: string
          id?: string
          is_active?: boolean
          max_value?: number
          min_value?: number
          rate_naira?: number
          region_id: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          card_type?: Database["public"]["Enums"]["card_type"]
          created_at?: string
          id?: string
          is_active?: boolean
          max_value?: number
          min_value?: number
          rate_naira?: number
          region_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_card_variants_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "gift_card_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_card_variants_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "gift_card_regions"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          created_at: string
          email: string
          id: string
          ip: string | null
          locked_until: string | null
          succeeded: boolean
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          ip?: string | null
          locked_until?: string | null
          succeeded?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          ip?: string | null
          locked_until?: string | null
          succeeded?: boolean
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type?: string
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      otp_codes: {
        Row: {
          attempts: number
          code_hash: string
          consumed_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          purpose: Database["public"]["Enums"]["otp_purpose"]
          resend_count: number
          user_id: string | null
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          purpose: Database["public"]["Enums"]["otp_purpose"]
          resend_count?: number
          user_id?: string | null
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          purpose?: Database["public"]["Enums"]["otp_purpose"]
          resend_count?: number
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          admin_code: string | null
          avatar_url: string | null
          created_at: string
          deleted_at: string | null
          email: string
          full_name: string
          hide_balance_default: boolean
          id: string
          is_verified: boolean
          phone: string | null
          push_enabled: boolean
          sound_enabled: boolean
          updated_at: string
        }
        Insert: {
          admin_code?: string | null
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          email: string
          full_name?: string
          hide_balance_default?: boolean
          id: string
          is_verified?: boolean
          phone?: string | null
          push_enabled?: boolean
          sound_enabled?: boolean
          updated_at?: string
        }
        Update: {
          admin_code?: string | null
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string
          full_name?: string
          hide_balance_default?: boolean
          id?: string
          is_verified?: boolean
          phone?: string | null
          push_enabled?: boolean
          sound_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      smtp_settings: {
        Row: {
          from_email: string | null
          from_name: string | null
          host: string | null
          id: string
          port: number | null
          secure: boolean
          updated_at: string
          use_builtin: boolean
          username: string | null
        }
        Insert: {
          from_email?: string | null
          from_name?: string | null
          host?: string | null
          id?: string
          port?: number | null
          secure?: boolean
          updated_at?: string
          use_builtin?: boolean
          username?: string | null
        }
        Update: {
          from_email?: string | null
          from_name?: string | null
          host?: string | null
          id?: string
          port?: number | null
          secure?: boolean
          updated_at?: string
          use_builtin?: boolean
          username?: string | null
        }
        Relationships: []
      }
      trade_images: {
        Row: {
          created_at: string
          id: string
          kind: string
          storage_path: string
          trade_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          storage_path: string
          trade_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          storage_path?: string
          trade_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_images_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          admin_note: string | null
          brand_id: string | null
          brand_name: string
          card_type: Database["public"]["Enums"]["card_type"]
          created_at: string
          currency: string
          ecode: string | null
          ecode_pin: string | null
          expected_payout: number
          face_value: number
          id: string
          paid_amount: number
          rate_at_submit: number
          region_code: string
          region_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["trade_status"]
          updated_at: string
          user_id: string
          variant_id: string | null
        }
        Insert: {
          admin_note?: string | null
          brand_id?: string | null
          brand_name: string
          card_type: Database["public"]["Enums"]["card_type"]
          created_at?: string
          currency?: string
          ecode?: string | null
          ecode_pin?: string | null
          expected_payout: number
          face_value: number
          id?: string
          paid_amount?: number
          rate_at_submit: number
          region_code: string
          region_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["trade_status"]
          updated_at?: string
          user_id: string
          variant_id?: string | null
        }
        Update: {
          admin_note?: string | null
          brand_id?: string | null
          brand_name?: string
          card_type?: Database["public"]["Enums"]["card_type"]
          created_at?: string
          currency?: string
          ecode?: string | null
          ecode_pin?: string | null
          expected_payout?: number
          face_value?: number
          id?: string
          paid_amount?: number
          rate_at_submit?: number
          region_code?: string
          region_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["trade_status"]
          updated_at?: string
          user_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trades_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "gift_card_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "gift_card_regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "gift_card_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          id: string
          note: string | null
          reference_id: string | null
          reference_type: string | null
          type: Database["public"]["Enums"]["wallet_txn_type"]
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          id?: string
          note?: string | null
          reference_id?: string | null
          reference_type?: string | null
          type: Database["public"]["Enums"]["wallet_txn_type"]
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          id?: string
          note?: string | null
          reference_id?: string | null
          reference_type?: string | null
          type?: Database["public"]["Enums"]["wallet_txn_type"]
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance_naira: number
          created_at: string
          held_naira: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance_naira?: number
          created_at?: string
          held_naira?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance_naira?: number
          created_at?: string
          held_naira?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          admin_note: string | null
          amount: number
          bank_account_id: string | null
          bank_snapshot: Json | null
          created_at: string
          fee: number
          id: string
          net_amount: number
          processed_at: string | null
          processed_by: string | null
          status: Database["public"]["Enums"]["withdrawal_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount: number
          bank_account_id?: string | null
          bank_snapshot?: Json | null
          created_at?: string
          fee?: number
          id?: string
          net_amount: number
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          bank_account_id?: string | null
          bank_snapshot?: Json | null
          created_at?: string
          fee?: number
          id?: string
          net_amount?: number
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
      card_type: "physical" | "ecode"
      otp_purpose: "signup" | "login" | "reset"
      trade_status:
        | "pending"
        | "successful"
        | "partially_paid"
        | "used"
        | "error"
      wallet_txn_type: "credit" | "debit" | "hold" | "release" | "fee"
      withdrawal_status: "requested" | "approved" | "cancelled" | "paid"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
      card_type: ["physical", "ecode"],
      otp_purpose: ["signup", "login", "reset"],
      trade_status: [
        "pending",
        "successful",
        "partially_paid",
        "used",
        "error",
      ],
      wallet_txn_type: ["credit", "debit", "hold", "release", "fee"],
      withdrawal_status: ["requested", "approved", "cancelled", "paid"],
    },
  },
} as const
