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
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      cards: {
        Row: {
          grammar_point_id: string | null
          id: string
          kind: string
          vocabulary_id: string | null
        }
        Insert: {
          grammar_point_id?: string | null
          id?: string
          kind: string
          vocabulary_id?: string | null
        }
        Update: {
          grammar_point_id?: string | null
          id?: string
          kind?: string
          vocabulary_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cards_grammar_point_id_fkey"
            columns: ["grammar_point_id"]
            isOneToOne: true
            referencedRelation: "grammar_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_vocabulary_id_fkey"
            columns: ["vocabulary_id"]
            isOneToOne: true
            referencedRelation: "vocabulary_items"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          description: string
          dialect_id: string
          id: string
          level: string
          position: number
          published: boolean
          slug: string
          title: string
        }
        Insert: {
          description?: string
          dialect_id: string
          id?: string
          level?: string
          position: number
          published?: boolean
          slug: string
          title: string
        }
        Update: {
          description?: string
          dialect_id?: string
          id?: string
          level?: string
          position?: number
          published?: boolean
          slug?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_dialect_id_fkey"
            columns: ["dialect_id"]
            isOneToOne: false
            referencedRelation: "dialects"
            referencedColumns: ["id"]
          },
        ]
      }
      deck_items: {
        Row: {
          card_id: string
          deck_id: string
          position: number
        }
        Insert: {
          card_id: string
          deck_id: string
          position: number
        }
        Update: {
          card_id?: string
          deck_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "deck_items_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deck_items_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
        ]
      }
      deck_translations: {
        Row: {
          deck_id: string
          description: string | null
          locale: string
          title: string
        }
        Insert: {
          deck_id: string
          description?: string | null
          locale: string
          title: string
        }
        Update: {
          deck_id?: string
          description?: string | null
          locale?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "deck_translations_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deck_translations_locale_fkey"
            columns: ["locale"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["code"]
          },
        ]
      }
      decks: {
        Row: {
          code: string
          color: string | null
          emoji: string | null
          id: string
          kind: string
          parent_id: string | null
          position: number
          published: boolean
        }
        Insert: {
          code: string
          color?: string | null
          emoji?: string | null
          id?: string
          kind?: string
          parent_id?: string | null
          position: number
          published?: boolean
        }
        Update: {
          code?: string
          color?: string | null
          emoji?: string | null
          id?: string
          kind?: string
          parent_id?: string | null
          position?: number
          published?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "decks_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
        ]
      }
      dialects: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      exercises: {
        Row: {
          id: string
          lesson_id: string
          payload: Json
          position: number
          type: Database["public"]["Enums"]["exercise_type"]
          vocabulary_id: string | null
        }
        Insert: {
          id?: string
          lesson_id: string
          payload?: Json
          position: number
          type: Database["public"]["Enums"]["exercise_type"]
          vocabulary_id?: string | null
        }
        Update: {
          id?: string
          lesson_id?: string
          payload?: Json
          position?: number
          type?: Database["public"]["Enums"]["exercise_type"]
          vocabulary_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercises_vocabulary_id_fkey"
            columns: ["vocabulary_id"]
            isOneToOne: false
            referencedRelation: "vocabulary_items"
            referencedColumns: ["id"]
          },
        ]
      }
      grammar_exercises: {
        Row: {
          code: string
          dialect_id: string | null
          grammar_point_id: string
          id: string
          level: number
          payload: Json
          type: string
        }
        Insert: {
          code: string
          dialect_id?: string | null
          grammar_point_id: string
          id?: string
          level: number
          payload: Json
          type: string
        }
        Update: {
          code?: string
          dialect_id?: string | null
          grammar_point_id?: string
          id?: string
          level?: number
          payload?: Json
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "grammar_exercises_dialect_id_fkey"
            columns: ["dialect_id"]
            isOneToOne: false
            referencedRelation: "dialects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grammar_exercises_grammar_point_id_fkey"
            columns: ["grammar_point_id"]
            isOneToOne: false
            referencedRelation: "grammar_points"
            referencedColumns: ["id"]
          },
        ]
      }
      grammar_point_translations: {
        Row: {
          explanation: string | null
          grammar_point_id: string
          locale: string
          title: string | null
        }
        Insert: {
          explanation?: string | null
          grammar_point_id: string
          locale: string
          title?: string | null
        }
        Update: {
          explanation?: string | null
          grammar_point_id?: string
          locale?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grammar_point_translations_grammar_point_id_fkey"
            columns: ["grammar_point_id"]
            isOneToOne: false
            referencedRelation: "grammar_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grammar_point_translations_locale_fkey"
            columns: ["locale"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["code"]
          },
        ]
      }
      grammar_points: {
        Row: {
          code: string
          dialect_id: string | null
          id: string
        }
        Insert: {
          code: string
          dialect_id?: string | null
          id?: string
        }
        Update: {
          code?: string
          dialect_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grammar_points_dialect_id_fkey"
            columns: ["dialect_id"]
            isOneToOne: false
            referencedRelation: "dialects"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          best_score: number
          completed_at: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          best_score: number
          completed_at?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          best_score?: number
          completed_at?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          course_id: string
          description: string
          id: string
          position: number
          published: boolean
          slug: string
          title: string
        }
        Insert: {
          course_id: string
          description?: string
          id?: string
          position: number
          published?: boolean
          slug: string
          title: string
        }
        Update: {
          course_id?: string
          description?: string
          id?: string
          position?: number
          published?: boolean
          slug?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      locales: {
        Row: {
          code: string
          name: string
        }
        Insert: {
          code: string
          name: string
        }
        Update: {
          code?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          card_front: string
          created_at: string
          dialect_id: string | null
          display_name: string | null
          id: string
          interests: string[]
          locale: string
          new_cards_per_day: number
          onboarded_at: string | null
          swiss_german_level: string | null
        }
        Insert: {
          card_front?: string
          created_at?: string
          dialect_id?: string | null
          display_name?: string | null
          id: string
          interests?: string[]
          locale?: string
          new_cards_per_day?: number
          onboarded_at?: string | null
          swiss_german_level?: string | null
        }
        Update: {
          card_front?: string
          created_at?: string
          dialect_id?: string | null
          display_name?: string | null
          id?: string
          interests?: string[]
          locale?: string
          new_cards_per_day?: number
          onboarded_at?: string | null
          swiss_german_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_dialect_id_fkey"
            columns: ["dialect_id"]
            isOneToOne: false
            referencedRelation: "dialects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_locale_fkey"
            columns: ["locale"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["code"]
          },
        ]
      }
      review_items: {
        Row: {
          card_id: string
          difficulty: number
          due_at: string
          lapses: number
          last_review_at: string | null
          learning_step: number
          reps: number
          schedule_status: string
          scheduled_days: number
          stability: number
          state: number
          user_id: string
        }
        Insert: {
          card_id: string
          difficulty?: number
          due_at?: string
          lapses?: number
          last_review_at?: string | null
          learning_step?: number
          reps?: number
          schedule_status?: string
          scheduled_days?: number
          stability?: number
          state?: number
          user_id: string
        }
        Update: {
          card_id?: string
          difficulty?: number
          due_at?: string
          lapses?: number
          last_review_at?: string | null
          learning_step?: number
          reps?: number
          schedule_status?: string
          scheduled_days?: number
          stability?: number
          state?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_items_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      review_log: {
        Row: {
          card_id: string
          correct: boolean | null
          difficulty: number
          due_at: string
          exercise_id: string | null
          id: string
          introduced: boolean
          last_review_at: string | null
          learning_step: number
          model: string
          rating: number
          reviewed_at: string
          schedule_status: string
          scheduled_days: number
          stability: number
          state: number
          user_id: string
        }
        Insert: {
          card_id: string
          correct?: boolean | null
          difficulty: number
          due_at: string
          exercise_id?: string | null
          id: string
          introduced: boolean
          last_review_at?: string | null
          learning_step: number
          model: string
          rating: number
          reviewed_at: string
          schedule_status: string
          scheduled_days: number
          stability: number
          state: number
          user_id: string
        }
        Update: {
          card_id?: string
          correct?: boolean | null
          difficulty?: number
          due_at?: string
          exercise_id?: string | null
          id?: string
          introduced?: boolean
          last_review_at?: string | null
          learning_step?: number
          model?: string
          rating?: number
          reviewed_at?: string
          schedule_status?: string
          scheduled_days?: number
          stability?: number
          state?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_log_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_log_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "grammar_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      vocabulary_items: {
        Row: {
          audio_path: string | null
          code: string
          dialect_id: string
          high_german: string
          id: string
          swiss_german: string
        }
        Insert: {
          audio_path?: string | null
          code: string
          dialect_id: string
          high_german: string
          id?: string
          swiss_german: string
        }
        Update: {
          audio_path?: string | null
          code?: string
          dialect_id?: string
          high_german?: string
          id?: string
          swiss_german?: string
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_items_dialect_id_fkey"
            columns: ["dialect_id"]
            isOneToOne: false
            referencedRelation: "dialects"
            referencedColumns: ["id"]
          },
        ]
      }
      vocabulary_translations: {
        Row: {
          locale: string
          meaning: string | null
          notes: string | null
          vocabulary_id: string
        }
        Insert: {
          locale: string
          meaning?: string | null
          notes?: string | null
          vocabulary_id: string
        }
        Update: {
          locale?: string
          meaning?: string | null
          notes?: string | null
          vocabulary_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_translations_locale_fkey"
            columns: ["locale"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "vocabulary_translations_vocabulary_id_fkey"
            columns: ["vocabulary_id"]
            isOneToOne: false
            referencedRelation: "vocabulary_items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_lesson: {
        Args: { p_lesson_id: string; p_score: number }
        Returns: undefined
      }
      deck_grammar_points: {
        Args: { p_deck_code: string }
        Returns: {
          card_id: string
          due_at: string
          explanation: string
          state: number
          title: string
        }[]
      }
      deck_text: {
        Args: { p_deck_id: string }
        Returns: {
          description: string
          title: string
        }[]
      }
      deck_words: {
        Args: { p_deck_code: string }
        Returns: {
          card_id: string
          due_at: string
          high_german: string
          meaning: string
          notes: string
          state: number
          swiss_german: string
        }[]
      }
      due_flashcards: {
        Args: { p_deck_code?: string; p_limit: number }
        Returns: {
          audio_path: string
          card_id: string
          difficulty: number
          due_at: string
          high_german: string
          kind: string
          lapses: number
          last_exercise_id: string
          last_review_at: string
          learning_step: number
          meaning: string
          notes: string
          reps: number
          schedule_status: string
          scheduled_days: number
          stability: number
          state: number
          swiss_german: string
        }[]
      }
      flashcard_decks: {
        Args: never
        Returns: {
          card_count: number
          code: string
          color: string
          deck_position: number
          description: string
          due_count: number
          due_review_count: number
          emoji: string
          id: string
          kind: string
          new_count: number
          parent_id: string
          title: string
        }[]
      }
      flashcard_summary: {
        Args: never
        Returns: {
          due_learning_count: number
          due_learning_known_count: number
          due_review_count: number
          introduced_today: number
          reviewed_today: number
          reviews_today: number
        }[]
      }
      grammar_content: {
        Args: { p_card_ids: string[] }
        Returns: {
          card_id: string
          exercises: Json
          explanation: string
          title: string
        }[]
      }
      grammar_text: {
        Args: { p_grammar_point_id: string }
        Returns: {
          explanation: string
          title: string
        }[]
      }
      learner_cards: {
        Args: never
        Returns: {
          grammar_point_id: string | null
          id: string
          kind: string
          vocabulary_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "cards"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      learner_locale: { Args: never; Returns: string }
      new_flashcards: {
        Args: { p_deck_code: string; p_limit: number }
        Returns: {
          audio_path: string
          card_id: string
          high_german: string
          kind: string
          meaning: string
          notes: string
          swiss_german: string
        }[]
      }
      save_review: {
        Args: {
          p_card: Json
          p_card_id: string
          p_correct?: boolean
          p_exercise_id?: string
          p_expected_reps: number
          p_log: Json
          p_model: string
          p_review_id: string
        }
        Returns: undefined
      }
      vocabulary_text: {
        Args: { p_vocabulary_id: string }
        Returns: {
          meaning: string
          notes: string
        }[]
      }
    }
    Enums: {
      exercise_type: "vocab_card" | "multiple_choice" | "word_order"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      exercise_type: ["vocab_card", "multiple_choice", "word_order"],
    },
  },
} as const
