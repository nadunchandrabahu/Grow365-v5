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
      admin_access_codes: {
        Row: {
          code_hash: string
          code_prefix: string
          created_at: string
          created_by: string
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number
          use_count: number
        }
        Insert: {
          code_hash: string
          code_prefix: string
          created_at?: string
          created_by: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          use_count?: number
        }
        Update: {
          code_hash?: string
          code_prefix?: string
          created_at?: string
          created_by?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          use_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "admin_access_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          bible_ref: string | null
          created_at: string
          devotional_id: string | null
          id: string
          kind: Database["public"]["Enums"]["bookmark_kind"]
          label: string | null
          target_id: string | null
          user_id: string
        }
        Insert: {
          bible_ref?: string | null
          created_at?: string
          devotional_id?: string | null
          id?: string
          kind: Database["public"]["Enums"]["bookmark_kind"]
          label?: string | null
          target_id?: string | null
          user_id: string
        }
        Update: {
          bible_ref?: string | null
          created_at?: string
          devotional_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["bookmark_kind"]
          label?: string | null
          target_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_devotional_id_fkey"
            columns: ["devotional_id"]
            isOneToOne: false
            referencedRelation: "devotionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      devotional_series: {
        Row: {
          cover_path: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          cover_path?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          cover_path?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      devotionals: {
        Row: {
          cover_path: string | null
          created_at: string
          day_of_year: number
          description: string | null
          express_url: string
          extra_refs: string | null
          form_response_id: string | null
          id: string
          is_free: boolean
          last_checked_at: string | null
          last_status: number | null
          memory_verse: string | null
          primary_book: string | null
          primary_chapter: number | null
          primary_verses: string | null
          publish_date: string | null
          published_at: string | null
          reviewer_notes: string | null
          series_id: string | null
          sort_index: number | null
          status: Database["public"]["Enums"]["devotional_status"]
          submitted_by: string | null
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          cover_path?: string | null
          created_at?: string
          day_of_year: number
          description?: string | null
          express_url: string
          extra_refs?: string | null
          form_response_id?: string | null
          id?: string
          is_free?: boolean
          last_checked_at?: string | null
          last_status?: number | null
          memory_verse?: string | null
          primary_book?: string | null
          primary_chapter?: number | null
          primary_verses?: string | null
          publish_date?: string | null
          published_at?: string | null
          reviewer_notes?: string | null
          series_id?: string | null
          sort_index?: number | null
          status?: Database["public"]["Enums"]["devotional_status"]
          submitted_by?: string | null
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          cover_path?: string | null
          created_at?: string
          day_of_year?: number
          description?: string | null
          express_url?: string
          extra_refs?: string | null
          form_response_id?: string | null
          id?: string
          is_free?: boolean
          last_checked_at?: string | null
          last_status?: number | null
          memory_verse?: string | null
          primary_book?: string | null
          primary_chapter?: number | null
          primary_verses?: string | null
          publish_date?: string | null
          published_at?: string | null
          reviewer_notes?: string | null
          series_id?: string | null
          sort_index?: number | null
          status?: Database["public"]["Enums"]["devotional_status"]
          submitted_by?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "devotionals_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "devotional_series"
            referencedColumns: ["id"]
          },
        ]
      }
      group_join_attempts: {
        Row: {
          attempt_time: string
          id: string
          success: boolean
          user_id: string
        }
        Insert: {
          attempt_time?: string
          id?: string
          success: boolean
          user_id: string
        }
        Update: {
          attempt_time?: string
          id?: string
          success?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_join_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          joined_at: string
          role: Database["public"]["Enums"]["group_role"]
          user_id: string
        }
        Insert: {
          group_id: string
          joined_at?: string
          role?: Database["public"]["Enums"]["group_role"]
          user_id: string
        }
        Update: {
          group_id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["group_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_notes: {
        Row: {
          author_id: string | null
          bible_ref: string | null
          content: string
          created_at: string
          devotional_id: string | null
          group_id: string
          id: string
          title: string | null
          updated_at: string
          visibility: Database["public"]["Enums"]["note_visibility"]
        }
        Insert: {
          author_id?: string | null
          bible_ref?: string | null
          content: string
          created_at?: string
          devotional_id?: string | null
          group_id: string
          id?: string
          title?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["note_visibility"]
        }
        Update: {
          author_id?: string | null
          bible_ref?: string | null
          content?: string
          created_at?: string
          devotional_id?: string | null
          group_id?: string
          id?: string
          title?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["note_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "group_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_notes_devotional_id_fkey"
            columns: ["devotional_id"]
            isOneToOne: false
            referencedRelation: "devotionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_notes_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_questions: {
        Row: {
          author_id: string | null
          bible_ref: string | null
          body: string | null
          created_at: string
          devotional_id: string | null
          group_id: string
          id: string
          is_resolved: boolean
          reply_count: number
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          bible_ref?: string | null
          body?: string | null
          created_at?: string
          devotional_id?: string | null
          group_id: string
          id?: string
          is_resolved?: boolean
          reply_count?: number
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          bible_ref?: string | null
          body?: string | null
          created_at?: string
          devotional_id?: string | null
          group_id?: string
          id?: string
          is_resolved?: boolean
          reply_count?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_questions_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_questions_devotional_id_fkey"
            columns: ["devotional_id"]
            isOneToOne: false
            referencedRelation: "devotionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_questions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          cover_path: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          join_code: string
          join_secret: string
          name: string
          owner_id: string
        }
        Insert: {
          cover_path?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          join_code: string
          join_secret: string
          name: string
          owner_id: string
        }
        Update: {
          cover_path?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          join_code?: string
          join_secret?: string
          name?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          bible_ref: string | null
          content: string
          created_at: string
          devotional_id: string | null
          entry_date: string
          group_id: string | null
          id: string
          is_private: boolean
          section: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bible_ref?: string | null
          content?: string
          created_at?: string
          devotional_id?: string | null
          entry_date?: string
          group_id?: string | null
          id?: string
          is_private?: boolean
          section?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bible_ref?: string | null
          content?: string
          created_at?: string
          devotional_id?: string | null
          entry_date?: string
          group_id?: string | null
          id?: string
          is_private?: boolean
          section?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_devotional_id_fkey"
            columns: ["devotional_id"]
            isOneToOne: false
            referencedRelation: "devotionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_group_fk"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          display_name: string
          id: string
          is_admin: boolean
          onboarded_at: string | null
          reminder_enabled: boolean
          reminder_time: string | null
          start_date: string
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          display_name?: string
          id: string
          is_admin?: boolean
          onboarded_at?: string | null
          reminder_enabled?: boolean
          reminder_time?: string | null
          start_date?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_admin?: boolean
          onboarded_at?: string | null
          reminder_enabled?: boolean
          reminder_time?: string | null
          start_date?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      question_replies: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
          parent_id: string | null
          question_id: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          parent_id?: string | null
          question_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          question_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_replies_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_replies_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "question_replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_replies_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "group_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_progress: {
        Row: {
          completed_at: string | null
          devotional_id: string
          first_opened: string
          scroll_pct: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          devotional_id: string
          first_opened?: string
          scroll_pct?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          devotional_id?: string
          first_opened?: string
          scroll_pct?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_progress_devotional_id_fkey"
            columns: ["devotional_id"]
            isOneToOne: false
            referencedRelation: "devotionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_events: {
        Row: {
          event_type: string
          id: number
          payload: Json
          received_at: string
          user_id: string | null
        }
        Insert: {
          event_type: string
          id?: number
          payload: Json
          received_at?: string
          user_id?: string | null
        }
        Update: {
          event_type?: string
          id?: number
          payload?: Json
          received_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          entitlement: string
          granted_reason: string | null
          is_in_grace: boolean
          original_txn_id: string | null
          period_end: string | null
          platform: string | null
          product_id: string | null
          rc_customer_id: string | null
          status: Database["public"]["Enums"]["sub_status"]
          updated_at: string
          user_id: string
          will_renew: boolean
        }
        Insert: {
          entitlement?: string
          granted_reason?: string | null
          is_in_grace?: boolean
          original_txn_id?: string | null
          period_end?: string | null
          platform?: string | null
          product_id?: string | null
          rc_customer_id?: string | null
          status?: Database["public"]["Enums"]["sub_status"]
          updated_at?: string
          user_id: string
          will_renew?: boolean
        }
        Update: {
          entitlement?: string
          granted_reason?: string | null
          is_in_grace?: boolean
          original_txn_id?: string | null
          period_end?: string | null
          platform?: string | null
          product_id?: string | null
          rc_customer_id?: string | null
          status?: Database["public"]["Enums"]["sub_status"]
          updated_at?: string
          user_id?: string
          will_renew?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_issue_access_code: {
        Args: {
          p_description?: string
          p_expires_at?: string
          p_max_uses?: number
        }
        Returns: {
          code: string
          code_prefix: string
          created_at: string
          description: string
          expires_at: string
          id: string
          is_active: boolean
          max_uses: number
          use_count: number
        }[]
      }
      admin_list_groups: {
        Args: never
        Returns: {
          cover_path: string
          created_at: string
          description: string
          id: string
          is_active: boolean
          member_count: number
          name: string
        }[]
      }
      admin_revoke_access_code: {
        Args: { p_code_id: string }
        Returns: undefined
      }
      admin_search_users: {
        Args: { p_query?: string }
        Returns: {
          created_at: string
          display_name: string
          email: string
          id: string
          is_admin: boolean
        }[]
      }
      admin_set_devotional_status: {
        Args: {
          p_id: string
          p_publish_date?: string
          p_status: Database["public"]["Enums"]["devotional_status"]
        }
        Returns: {
          cover_path: string | null
          created_at: string
          day_of_year: number
          description: string | null
          express_url: string
          extra_refs: string | null
          form_response_id: string | null
          id: string
          is_free: boolean
          last_checked_at: string | null
          last_status: number | null
          memory_verse: string | null
          primary_book: string | null
          primary_chapter: number | null
          primary_verses: string | null
          publish_date: string | null
          published_at: string | null
          reviewer_notes: string | null
          series_id: string | null
          sort_index: number | null
          status: Database["public"]["Enums"]["devotional_status"]
          submitted_by: string | null
          tags: string[]
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "devotionals"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_set_group_active: {
        Args: { p_group_id: string; p_is_active: boolean }
        Returns: undefined
      }
      admin_set_user_admin: {
        Args: { p_is_admin: boolean; p_user_id: string }
        Returns: undefined
      }
      create_group: {
        Args: {
          p_description: string
          p_join_code: string
          p_name: string
          p_secret: string
        }
        Returns: string
      }
      current_journey_day: { Args: { uid?: string }; Returns: number }
      get_group_join_code: { Args: { gid: string }; Returns: string }
      has_active_subscription: { Args: { uid?: string }; Returns: boolean }
      is_app_admin: { Args: { uid?: string }; Returns: boolean }
      is_group_admin: { Args: { gid: string; uid?: string }; Returns: boolean }
      is_group_member: { Args: { gid: string; uid?: string }; Returns: boolean }
      is_group_owner: { Args: { gid: string; uid?: string }; Returns: boolean }
      join_group: {
        Args: { p_code: string; p_secret: string }
        Returns: Database["public"]["CompositeTypes"]["join_group_result"]
        SetofOptions: {
          from: "*"
          to: "join_group_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      publish_scheduled_devotionals: { Args: never; Returns: number }
      search_journal_entries: {
        Args: { search_term: string }
        Returns: {
          bible_ref: string | null
          content: string
          created_at: string
          devotional_id: string | null
          entry_date: string
          group_id: string | null
          id: string
          is_private: boolean
          section: string | null
          title: string | null
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "journal_entries"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      bookmark_kind: "devotional" | "passage" | "note" | "question"
      devotional_status:
        | "draft"
        | "scheduled"
        | "published"
        | "needs_attention"
        | "archived"
      group_role: "owner" | "admin" | "member"
      note_visibility: "private" | "group"
      sub_status:
        | "trial"
        | "active"
        | "past_due"
        | "cancelled"
        | "expired"
        | "granted"
    }
    CompositeTypes: {
      join_group_result: {
        group_id: string | null
        error_code: string | null
      }
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
      bookmark_kind: ["devotional", "passage", "note", "question"],
      devotional_status: [
        "draft",
        "scheduled",
        "published",
        "needs_attention",
        "archived",
      ],
      group_role: ["owner", "admin", "member"],
      note_visibility: ["private", "group"],
      sub_status: [
        "trial",
        "active",
        "past_due",
        "cancelled",
        "expired",
        "granted",
      ],
    },
  },
} as const
