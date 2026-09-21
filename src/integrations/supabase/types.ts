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
      app_settings: {
        Row: {
          alert_emails: string[]
          from_name: string
          id: boolean
          reply_to: string | null
          updated_at: string
        }
        Insert: {
          alert_emails?: string[]
          from_name?: string
          id?: boolean
          reply_to?: string | null
          updated_at?: string
        }
        Update: {
          alert_emails?: string[]
          from_name?: string
          id?: boolean
          reply_to?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          account_name: string
          account_number: string
          bank_code: string | null
          bank_id: string | null
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
          bank_id?: string | null
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
          bank_id?: string | null
          bank_name?: string
          created_at?: string
          id?: string
          is_default?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "banks"
            referencedColumns: ["id"]
          },
        ]
      }
      banks: {
        Row: {
          code: string | null
          created_at: string
          id: string
          is_active: boolean
          is_digital: boolean
          name: string
          sort_order: number
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_digital?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_digital?: boolean
          name?: string
          sort_order?: number
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
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          read_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          read_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          read_at?: string | null
        }
        Relationships: []
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
          frozen_at: string | null
          frozen_reason: string | null
          full_name: string
          hide_balance_default: boolean
          id: string
          is_verified: boolean
          phone: string | null
          pin_attempts: number
          pin_locked_until: string | null
          push_enabled: boolean
          referral_code: string | null
          referred_by: string | null
          sound_enabled: boolean
          updated_at: string
          withdrawal_pin_hash: string | null
        }
        Insert: {
          admin_code?: string | null
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          email: string
          frozen_at?: string | null
          frozen_reason?: string | null
          full_name?: string
          hide_balance_default?: boolean
          id: string
          is_verified?: boolean
          phone?: string | null
          pin_attempts?: number
          pin_locked_until?: string | null
          push_enabled?: boolean
          referral_code?: string | null
          referred_by?: string | null
          sound_enabled?: boolean
          updated_at?: string
          withdrawal_pin_hash?: string | null
        }
        Update: {
          admin_code?: string | null
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string
          frozen_at?: string | null
          frozen_reason?: string | null
          full_name?: string
          hide_balance_default?: boolean
          id?: string
          is_verified?: boolean
          phone?: string | null
          pin_attempts?: number
          pin_locked_until?: string | null
          push_enabled?: boolean
          referral_code?: string | null
          referred_by?: string | null
          sound_enabled?: boolean
          updated_at?: string
          withdrawal_pin_hash?: string | null
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
          flagged_duplicate: boolean
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
          user_note: string | null
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
          flagged_duplicate?: boolean
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
          user_note?: string | null
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
          flagged_duplicate?: boolean
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
          user_note?: string | null
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
          locked_naira: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance_naira?: number
          created_at?: string
          held_naira?: number
          id?: string
          locked_naira?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance_naira?: number
          created_at?: string
          held_naira?: number
          id?: string
          locked_naira?: number
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
      admin_adjust_wallet: {
        Args: { p_amount: number; p_note: string; p_user_id: string }
        Returns: number
      }
      admin_platform_stats: { Args: never; Returns: Json }
      admin_review_trade: {
        Args: {
          p_note?: string
          p_paid?: number
          p_status: Database["public"]["Enums"]["trade_status"]
          p_trade_id: string
        }
        Returns: {
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
          flagged_duplicate: boolean
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
          user_note: string | null
          variant_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "trades"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_set_frozen: {
        Args: { p_frozen: boolean; p_reason?: string; p_user_id: string }
        Returns: boolean
      }
      admin_withdrawal_decision: {
        Args: {
          p_id: string
          p_note?: string
          p_status: Database["public"]["Enums"]["withdrawal_status"]
        }
        Returns: {
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
        SetofOptions: {
          from: "*"
          to: "withdrawals"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      apply_wallet_change: {
        Args: {
          p_amount: number
          p_note: string
          p_reference_id: string
          p_reference_type: string
          p_type: Database["public"]["Enums"]["wallet_txn_type"]
          p_user_id: string
        }
        Returns: number
      }
      create_trade: {
        Args: {
          p_ecode?: string
          p_ecode_pin?: string
          p_face_value: number
          p_note?: string
          p_variant_id: string
        }
        Returns: {
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
          flagged_duplicate: boolean
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
          user_note: string | null
          variant_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "trades"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_withdrawal: {
        Args: { p_amount: number; p_bank_account_id: string; p_pin: string }
        Returns: {
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
        SetofOptions: {
          from: "*"
          to: "withdrawals"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      force_set_withdrawal_pin: {
        Args: { p_pin: string; p_user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      lock_bonus: {
        Args: { p_amount: number; p_note: string; p_user_id: string }
        Returns: undefined
      }
      pin_hash: { Args: { p_pin: string; p_user_id: string }; Returns: string }
      set_withdrawal_pin: {
        Args: { p_current_pin?: string; p_pin: string }
        Returns: boolean
      }
      unlock_bonus: { Args: { p_user_id: string }; Returns: undefined }
      withdrawal_pin_status: { Args: never; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "user"
      card_type: "physical" | "ecode"
      otp_purpose: "signup" | "login" | "reset" | "pin"
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
      otp_purpose: ["signup", "login", "reset", "pin"],
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
