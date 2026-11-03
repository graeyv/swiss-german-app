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
          deck_id: string
          position: number
          vocabulary_id: string
        }
        Insert: {
          deck_id: string
          position: number
          vocabulary_id: string
        }
        Update: {
          deck_id?: string
          position?: number
          vocabulary_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deck_items_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deck_items_vocabulary_id_fkey"
            columns: ["vocabulary_id"]
            isOneToOne: false
            referencedRelation: "vocabulary_items"
            referencedColumns: ["id"]
          },
        ]
      }
      decks: {
        Row: {
          code: string
          color: string | null
          description: string | null
          emoji: string | null
          id: string
          parent_id: string | null
          position: number
          published: boolean
          title: string
        }
        Insert: {
          code: string
          color?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          parent_id?: string | null
          position: number
          published?: boolean
          title: string
        }
        Update: {
          code?: string
          color?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          parent_id?: string | null
          position?: number
          published?: boolean
          title?: string
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
      profiles: {
        Row: {
          card_front: string
          created_at: string
          dialect_id: string | null
          display_name: string | null
          id: string
          new_cards_per_day: number
        }
        Insert: {
          card_front?: string
          created_at?: string
          dialect_id?: string | null
          display_name?: string | null
          id: string
          new_cards_per_day?: number
        }
        Update: {
          card_front?: string
          created_at?: string
          dialect_id?: string | null
          display_name?: string | null
          id?: string
          new_cards_per_day?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_dialect_id_fkey"
            columns: ["dialect_id"]
            isOneToOne: false
            referencedRelation: "dialects"
            referencedColumns: ["id"]
          },
        ]
      }
      review_items: {
        Row: {
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
          vocabulary_id: string
        }
        Insert: {
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
          vocabulary_id: string
        }
        Update: {
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
          vocabulary_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_items_vocabulary_id_fkey"
            columns: ["vocabulary_id"]
            isOneToOne: false
            referencedRelation: "vocabulary_items"
            referencedColumns: ["id"]
          },
        ]
      }
      review_log: {
        Row: {
          difficulty: number
          due_at: string
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
          vocabulary_id: string
        }
        Insert: {
          difficulty: number
          due_at: string
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
          vocabulary_id: string
        }
        Update: {
          difficulty?: number
          due_at?: string
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
          vocabulary_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_log_vocabulary_id_fkey"
            columns: ["vocabulary_id"]
            isOneToOne: false
            referencedRelation: "vocabulary_items"
            referencedColumns: ["id"]
          },
        ]
      }
      vocabulary_items: {
        Row: {
          audio_path: string | null
          code: string
          dialect_id: string
          english: string
          high_german: string
          id: string
          notes: string | null
          swiss_german: string
        }
        Insert: {
          audio_path?: string | null
          code: string
          dialect_id: string
          english: string
          high_german: string
          id?: string
          notes?: string | null
          swiss_german: string
        }
        Update: {
          audio_path?: string | null
          code?: string
          dialect_id?: string
          english?: string
          high_german?: string
          id?: string
          notes?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_lesson: {
        Args: { p_lesson_id: string; p_score: number }
        Returns: undefined
      }
      deck_words: {
        Args: { p_deck_code: string }
        Returns: {
          due_at: string
          english: string
          high_german: string
          notes: string
          state: number
          swiss_german: string
          vocabulary_id: string
        }[]
      }
      due_flashcards: {
        Args: { p_deck_code?: string; p_limit: number }
        Returns: {
          audio_path: string
          difficulty: number
          due_at: string
          english: string
          high_german: string
          lapses: number
          last_review_at: string
          learning_step: number
          notes: string
          reps: number
          schedule_status: string
          scheduled_days: number
          stability: number
          state: number
          swiss_german: string
          vocabulary_id: string
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
      new_flashcards: {
        Args: { p_deck_code: string; p_limit: number }
        Returns: {
          audio_path: string
          english: string
          high_german: string
          notes: string
          swiss_german: string
          vocabulary_id: string
        }[]
      }
      save_review: {
        Args: {
          p_card: Json
          p_expected_reps: number
          p_log: Json
          p_model: string
          p_review_id: string
          p_vocabulary_id: string
        }
        Returns: undefined
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
