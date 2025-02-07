export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          operationName?: string;
          query?: string;
          variables?: Json;
          extensions?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      announcements: {
        Row: {
          content: string | null;
          id: number;
          post_id: number | null;
          subContent: string | null;
          title: string;
        };
        Insert: {
          content?: string | null;
          id?: number;
          post_id?: number | null;
          subContent?: string | null;
          title: string;
        };
        Update: {
          content?: string | null;
          id?: number;
          post_id?: number | null;
          subContent?: string | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "announcements_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          }
        ];
      };
      calltoaction: {
        Row: {
          announcement_id: number | null;
          id: number;
          news_id: number | null;
          text: string;
          url: string | null;
        };
        Insert: {
          announcement_id?: number | null;
          id?: number;
          news_id?: number | null;
          text: string;
          url?: string | null;
        };
        Update: {
          announcement_id?: number | null;
          id?: number;
          news_id?: number | null;
          text?: string;
          url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "calltoaction_announcement_id_fkey";
            columns: ["announcement_id"];
            isOneToOne: false;
            referencedRelation: "announcements";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "calltoaction_news_id_fkey";
            columns: ["news_id"];
            isOneToOne: false;
            referencedRelation: "news";
            referencedColumns: ["id"];
          }
        ];
      };
      news: {
        Row: {
          content: string | null;
          description: string | null;
          id: number;
          post_id: number | null;
          title: string;
          type: "text" | "video" | "image";
        };
        Insert: {
          content?: string | null;
          description?: string | null;
          id?: number;
          post_id?: number | null;
          title: string;
          type: "text" | "video" | "image";
        };
        Update: {
          content?: string | null;
          description?: string | null;
          id?: number;
          post_id?: number | null;
          title?: string;
          type: "text" | "video" | "image";
        };
        Relationships: [
          {
            foreignKeyName: "news_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          }
        ];
      };
      posts: {
        Row: {
          announcements: Json | null;
          content: string | null;
          createdAt: string;
          generalPrayer: string | null;
          id: number;
          liveUrl: string | null;
          messenger: string | null;
          news: Json | null;
          offeringPrayer: string | null;
          openingPrayer: string | null;
          passage: string | null;
          place: string | null;
          praises: Json | null;
          schedule: string;
          subTitle: string | null;
          testimonyPrayer: string | null;
          testimonyTitle: string | null;
          title: string;
          word: string | null;
        };
        Insert: {
          announcements?: Json | null;
          content?: string | null;
          createdAt?: string;
          generalPrayer?: string | null;
          id?: number;
          liveUrl?: string | null;
          messenger?: string | null;
          news?: Json | null;
          offeringPrayer?: string | null;
          openingPrayer?: string | null;
          passage?: string | null;
          place?: string | null;
          praises?: Json | null;
          schedule: string;
          subTitle?: string | null;
          testimonyPrayer?: string | null;
          testimonyTitle?: string | null;
          title: string;
          word?: string | null;
        };
        Update: {
          announcements?: Json | null;
          content?: string | null;
          createdAt?: string;
          generalPrayer?: string | null;
          id?: number;
          liveUrl?: string | null;
          messenger?: string | null;
          news?: Json | null;
          offeringPrayer?: string | null;
          openingPrayer?: string | null;
          passage?: string | null;
          place?: string | null;
          praises?: Json | null;
          schedule?: string;
          subTitle?: string | null;
          testimonyPrayer?: string | null;
          testimonyTitle?: string | null;
          title?: string;
          word?: string | null;
        };
        Relationships: [];
      };
      praises: {
        Row: {
          id: number;
          post_id: number | null;
          title: string;
          youtubeurl: string | null;
        };
        Insert: {
          id?: number;
          post_id?: number | null;
          title: string;
          youtubeurl?: string | null;
        };
        Update: {
          id?: number;
          post_id?: number | null;
          title?: string;
          youtubeurl?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_post";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
      PublicSchema["Views"])
  ? (PublicSchema["Tables"] &
      PublicSchema["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
  ? PublicSchema["Enums"][PublicEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
  ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;
