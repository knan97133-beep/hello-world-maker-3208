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
      challenges: {
        Row: {
          created_at: string
          id: string
          level: Database["public"]["Enums"]["difficulty"]
          points: number
          prompt_ar: string | null
          prompt_en: string | null
          sort_order: number
          subject_id: string
          title_ar: string
          title_en: string
        }
        Insert: {
          created_at?: string
          id?: string
          level?: Database["public"]["Enums"]["difficulty"]
          points?: number
          prompt_ar?: string | null
          prompt_en?: string | null
          sort_order?: number
          subject_id: string
          title_ar: string
          title_en: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: Database["public"]["Enums"]["difficulty"]
          points?: number
          prompt_ar?: string | null
          prompt_en?: string | null
          sort_order?: number
          subject_id?: string
          title_ar?: string
          title_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenges_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      placement_questions: {
        Row: {
          correct_index: number
          created_at: string
          id: string
          level: Database["public"]["Enums"]["difficulty"]
          options_ar: string[]
          options_en: string[]
          question_ar: string
          question_en: string
          skill_key: string
          sort_order: number
        }
        Insert: {
          correct_index: number
          created_at?: string
          id?: string
          level?: Database["public"]["Enums"]["difficulty"]
          options_ar: string[]
          options_en: string[]
          question_ar: string
          question_en: string
          skill_key: string
          sort_order?: number
        }
        Update: {
          correct_index?: number
          created_at?: string
          id?: string
          level?: Database["public"]["Enums"]["difficulty"]
          options_ar?: string[]
          options_en?: string[]
          question_ar?: string
          question_en?: string
          skill_key?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "placement_questions_skill_key_fkey"
            columns: ["skill_key"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["key"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          current_semester: number | null
          current_year: number | null
          full_name: string | null
          id: string
          university: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          current_semester?: number | null
          current_year?: number | null
          full_name?: string | null
          id: string
          university?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          current_semester?: number | null
          current_year?: number | null
          full_name?: string | null
          id?: string
          university?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      progress: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          item_id: string | null
          item_type: Database["public"]["Enums"]["progress_item"]
          score: number | null
          subject_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          item_id?: string | null
          item_type: Database["public"]["Enums"]["progress_item"]
          score?: number | null
          subject_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          item_id?: string | null
          item_type?: Database["public"]["Enums"]["progress_item"]
          score?: number | null
          subject_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          description_ar: string | null
          description_en: string | null
          id: string
          level: Database["public"]["Enums"]["difficulty"]
          points: number
          sort_order: number
          subject_id: string
          title_ar: string
          title_en: string
        }
        Insert: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          level?: Database["public"]["Enums"]["difficulty"]
          points?: number
          sort_order?: number
          subject_id: string
          title_ar: string
          title_en: string
        }
        Update: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          level?: Database["public"]["Enums"]["difficulty"]
          points?: number
          sort_order?: number
          subject_id?: string
          title_ar?: string
          title_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_index: number
          created_at: string
          explanation_ar: string | null
          explanation_en: string | null
          id: string
          options_ar: string[]
          options_en: string[]
          question_ar: string
          question_en: string
          sort_order: number
          subject_id: string
        }
        Insert: {
          correct_index: number
          created_at?: string
          explanation_ar?: string | null
          explanation_en?: string | null
          id?: string
          options_ar: string[]
          options_en: string[]
          question_ar: string
          question_en: string
          sort_order?: number
          subject_id: string
        }
        Update: {
          correct_index?: number
          created_at?: string
          explanation_ar?: string | null
          explanation_en?: string | null
          id?: string
          options_ar?: string[]
          options_en?: string[]
          question_ar?: string
          question_en?: string
          sort_order?: number
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendations: {
        Row: {
          action_type: string
          body_ar: string | null
          body_en: string | null
          created_at: string
          done: boolean
          id: string
          priority: number
          skill_key: string | null
          subject_id: string | null
          title_ar: string
          title_en: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_type?: string
          body_ar?: string | null
          body_en?: string | null
          created_at?: string
          done?: boolean
          id?: string
          priority?: number
          skill_key?: string | null
          subject_id?: string | null
          title_ar: string
          title_en: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_type?: string
          body_ar?: string | null
          body_en?: string | null
          created_at?: string
          done?: boolean
          id?: string
          priority?: number
          skill_key?: string | null
          subject_id?: string | null
          title_ar?: string
          title_en?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_skill_key_fkey"
            columns: ["skill_key"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "recommendations_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          created_at: string
          duration_hours: number | null
          id: string
          is_free: boolean
          kind: Database["public"]["Enums"]["resource_kind"]
          provider: string | null
          sort_order: number
          subject_id: string
          title_ar: string
          title_en: string
          url: string | null
        }
        Insert: {
          created_at?: string
          duration_hours?: number | null
          id?: string
          is_free?: boolean
          kind?: Database["public"]["Enums"]["resource_kind"]
          provider?: string | null
          sort_order?: number
          subject_id: string
          title_ar: string
          title_en: string
          url?: string | null
        }
        Update: {
          created_at?: string
          duration_hours?: number | null
          id?: string
          is_free?: boolean
          kind?: Database["public"]["Enums"]["resource_kind"]
          provider?: string | null
          sort_order?: number
          subject_id?: string
          title_ar?: string
          title_en?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      semester_unlocks: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          semester: number
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          semester: number
          user_id: string
          year: number
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          semester?: number
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      skill_profile: {
        Row: {
          created_at: string
          id: string
          level: number
          skill_key: string
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          level?: number
          skill_key: string
          source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: number
          skill_key?: string
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_profile_skill_key_fkey"
            columns: ["skill_key"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["key"]
          },
        ]
      }
      skills: {
        Row: {
          created_at: string
          icon: string | null
          key: string
          name_ar: string
          name_en: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          icon?: string | null
          key: string
          name_ar: string
          name_en: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          icon?: string | null
          key?: string
          name_ar?: string
          name_en?: string
          sort_order?: number
        }
        Relationships: []
      }
      subject_instructors: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          subject_id: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          subject_id: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          subject_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subject_instructors_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string
          created_at: string
          description_ar: string | null
          description_en: string | null
          icon: string | null
          id: string
          name_ar: string
          name_en: string
          semester: number
          skill_key: string | null
          skills: string[]
          sort_order: number
          updated_at: string
          year: number
        }
        Insert: {
          code: string
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          icon?: string | null
          id?: string
          name_ar: string
          name_en: string
          semester: number
          skill_key?: string | null
          skills?: string[]
          sort_order?: number
          updated_at?: string
          year: number
        }
        Update: {
          code?: string
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          icon?: string | null
          id?: string
          name_ar?: string
          name_en?: string
          semester?: number
          skill_key?: string | null
          skills?: string[]
          sort_order?: number
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "subjects_skill_key_fkey"
            columns: ["skill_key"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["key"]
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
      is_subject_instructor: {
        Args: { _subject_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "student" | "instructor"
      difficulty: "easy" | "medium" | "hard"
      progress_item: "resource" | "project" | "challenge" | "quiz"
      resource_kind: "course" | "video" | "book" | "article"
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
      app_role: ["admin", "student", "instructor"],
      difficulty: ["easy", "medium", "hard"],
      progress_item: ["resource", "project", "challenge", "quiz"],
      resource_kind: ["course", "video", "book", "article"],
    },
  },
} as const
