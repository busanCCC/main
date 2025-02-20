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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
