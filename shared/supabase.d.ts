export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
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
      announcements: {
        Row: {
          actiontext: string | null
          actionurl: string | null
          calltoaction: boolean | null
          content: string | null
          contenttype: string | null
          id: number
          post_id: number | null
          subcontent: string | null
          title: string
        }
        Insert: {
          actiontext?: string | null
          actionurl?: string | null
          calltoaction?: boolean | null
          content?: string | null
          contenttype?: string | null
          id?: number
          post_id?: number | null
          subcontent?: string | null
          title: string
        }
        Update: {
          actiontext?: string | null
          actionurl?: string | null
          calltoaction?: boolean | null
          content?: string | null
          contenttype?: string | null
          id?: number
          post_id?: number | null
          subcontent?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      news: {
        Row: {
          actiontext: string | null
          actionurl: string | null
          calltoaction: boolean | null
          content: string | null
          description: string | null
          id: number
          post_id: number | null
          title: string
          type: string
        }
        Insert: {
          actiontext?: string | null
          actionurl?: string | null
          calltoaction?: boolean | null
          content?: string | null
          description?: string | null
          id?: number
          post_id?: number | null
          title: string
          type: string
        }
        Update: {
          actiontext?: string | null
          actionurl?: string | null
          calltoaction?: boolean | null
          content?: string | null
          description?: string | null
          id?: number
          post_id?: number | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string | null
          contenttype: string | null
          createdat: string | null
          generalprayer: string | null
          id: number
          liveurl: string | null
          messagetitle: string | null
          messenger: string | null
          offeringprayer: string | null
          openingprayer: string | null
          passage: string | null
          place: string | null
          placeurl: string | null
          schedule: string
          subtitle: string | null
          testimonyprayer: string | null
          testimonytitle: string | null
          title: string
          word: string | null
        }
        Insert: {
          content?: string | null
          contenttype?: string | null
          createdat?: string | null
          generalprayer?: string | null
          id?: number
          liveurl?: string | null
          messagetitle?: string | null
          messenger?: string | null
          offeringprayer?: string | null
          openingprayer?: string | null
          passage?: string | null
          place?: string | null
          placeurl?: string | null
          schedule: string
          subtitle?: string | null
          testimonyprayer?: string | null
          testimonytitle?: string | null
          title: string
          word?: string | null
        }
        Update: {
          content?: string | null
          contenttype?: string | null
          createdat?: string | null
          generalprayer?: string | null
          id?: number
          liveurl?: string | null
          messagetitle?: string | null
          messenger?: string | null
          offeringprayer?: string | null
          openingprayer?: string | null
          passage?: string | null
          place?: string | null
          placeurl?: string | null
          schedule?: string
          subtitle?: string | null
          testimonyprayer?: string | null
          testimonytitle?: string | null
          title?: string
          word?: string | null
        }
        Relationships: []
      }
      praises: {
        Row: {
          id: number
          post_id: number | null
          title: string
          youtubeurl: string | null
        }
        Insert: {
          id?: number
          post_id?: number | null
          title: string
          youtubeurl?: string | null
        }
        Update: {
          id?: number
          post_id?: number | null
          title?: string
          youtubeurl?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "praises_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      prayer_chain: {
        Row: {
          campus: string
          created_at: string | null
          date: string
          id: number
          prayers: string[]
          praying_count: number
        }
        Insert: {
          campus: string
          created_at?: string | null
          date: string
          id?: number
          prayers: string[]
          praying_count?: number
        }
        Update: {
          campus?: string
          created_at?: string | null
          date?: string
          id?: number
          prayers?: string[]
          praying_count?: number
        }
        Relationships: []
      }
      staff_info: {
        Row: {
          createdat: string | null
          id: number
          name: string
          role: string | null
        }
        Insert: {
          createdat?: string | null
          id?: number
          name: string
          role?: string | null
        }
        Update: {
          createdat?: string | null
          id?: number
          name?: string
          role?: string | null
        }
        Relationships: []
      }
      user_info: {
        Row: {
          avatar_url: string | null
          email: string | null
          id: string
          is_admin: boolean
          role: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          email?: string | null
          id: string
          is_admin?: boolean
          role?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          email?: string | null
          id?: string
          is_admin?: boolean
          role?: string
          username?: string | null
        }
        Relationships: []
      }
      videos: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          title: string
          youtube_url: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          title: string
          youtube_url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          title?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
