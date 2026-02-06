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
    PostgrestVersion: "12.2.3 (519615d)"
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
      achievements: {
        Row: {
          auto_condition: Json | null
          category: string
          created_at: string | null
          description: string
          display_order: number | null
          grant_type: string
          id: string
          image_key: string
          name: string
        }
        Insert: {
          auto_condition?: Json | null
          category: string
          created_at?: string | null
          description: string
          display_order?: number | null
          grant_type: string
          id?: string
          image_key: string
          name: string
        }
        Update: {
          auto_condition?: Json | null
          category?: string
          created_at?: string | null
          description?: string
          display_order?: number | null
          grant_type?: string
          id?: string
          image_key?: string
          name?: string
        }
        Relationships: []
      }
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
      chapel_orders: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_auto_generated: boolean | null
          note: string | null
          order_index: number
          type: string
          updated_at: string | null
          weekly_bulletin_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_auto_generated?: boolean | null
          note?: string | null
          order_index: number
          type: string
          updated_at?: string | null
          weekly_bulletin_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_auto_generated?: boolean | null
          note?: string | null
          order_index?: number
          type?: string
          updated_at?: string | null
          weekly_bulletin_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapel_orders_bulletin_fk"
            columns: ["weekly_bulletin_id"]
            isOneToOne: false
            referencedRelation: "weekly_bulletins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapel_orders_weekly_bulletin_id_fkey"
            columns: ["weekly_bulletin_id"]
            isOneToOne: false
            referencedRelation: "weekly_bulletins"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string | null
          created_at: string | null
          diary_id: number | null
          id: string
          image_expires_at: string | null
          room_id: string
          sender_id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          diary_id?: number | null
          id?: string
          image_expires_at?: string | null
          room_id: string
          sender_id: string
          type: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          diary_id?: number | null
          id?: string
          image_expires_at?: string | null
          room_id?: string
          sender_id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_diary_id_fkey"
            columns: ["diary_id"]
            isOneToOne: false
            referencedRelation: "spiritual_diaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_reports: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          message_id: string | null
          reason: string
          reporter_id: string
          room_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          message_id?: string | null
          reason: string
          reporter_id: string
          room_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          message_id?: string | null
          reason?: string
          reporter_id?: string
          room_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_reports_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_reports_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_room_members: {
        Row: {
          created_at: string
          id: string
          joined_at: string | null
          last_read_at: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          created_at: string
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          room_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          admin_id: string | null
          created_at: string | null
          id: string
          name: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          admin_id?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          admin_id?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: number
          created_at: string
          id: number
          user_id: string
        }
        Insert: {
          comment_id: number
          created_at?: string
          id?: number
          user_id: string
        }
        Update: {
          comment_id?: number
          created_at?: string
          id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments_with_author"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          author_id: string
          category: string
          comments_count: number | null
          content: string
          created_at: string
          id: number
          images: Json | null
          is_anonymous: boolean | null
          is_pinned: boolean | null
          likes_count: number | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          category: string
          comments_count?: number | null
          content: string
          created_at?: string
          id?: number
          images?: Json | null
          is_anonymous?: boolean | null
          is_pinned?: boolean | null
          likes_count?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          category?: string
          comments_count?: number | null
          content?: string
          created_at?: string
          id?: number
          images?: Json | null
          is_anonymous?: boolean | null
          is_pinned?: boolean | null
          likes_count?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      customevent: {
        Row: {
          created_at: string | null
          description: string | null
          eventname: string
          id: number
          index: number | null
          post_id: number | null
          subdescription: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          eventname: string
          id?: number
          index?: number | null
          post_id?: number | null
          subdescription?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          eventname?: string
          id?: number
          index?: number | null
          post_id?: number | null
          subdescription?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customevent_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_curations: {
        Row: {
          content: string
          created_at: string | null
          date: string
          id: number
          link_url: string | null
          reference: string | null
          thumbnail_url: string | null
          title: string
          type: Database["public"]["Enums"]["curation_type"]
        }
        Insert: {
          content: string
          created_at?: string | null
          date?: string
          id?: number
          link_url?: string | null
          reference?: string | null
          thumbnail_url?: string | null
          title: string
          type: Database["public"]["Enums"]["curation_type"]
        }
        Update: {
          content?: string
          created_at?: string | null
          date?: string
          id?: number
          link_url?: string | null
          reference?: string | null
          thumbnail_url?: string | null
          title?: string
          type?: Database["public"]["Enums"]["curation_type"]
        }
        Relationships: []
      }
      daily_devotions: {
        Row: {
          application: string | null
          created_at: string | null
          date: string
          day_of_week: string | null
          id: number
          questions: Json | null
          reference_notes: Json | null
          scripture_reference: string
          scripture_text: string
          title: string
          updated_at: string | null
        }
        Insert: {
          application?: string | null
          created_at?: string | null
          date: string
          day_of_week?: string | null
          id?: number
          questions?: Json | null
          reference_notes?: Json | null
          scripture_reference: string
          scripture_text: string
          title: string
          updated_at?: string | null
        }
        Update: {
          application?: string | null
          created_at?: string | null
          date?: string
          day_of_week?: string | null
          id?: number
          questions?: Json | null
          reference_notes?: Json | null
          scripture_reference?: string
          scripture_text?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      daily_journals: {
        Row: {
          answer_1: string | null
          answer_2: string | null
          answer_3: string | null
          answer_4: string | null
          content: string | null
          created_at: string | null
          diary_date: string
          diary_type: string
          emotion_id: number | null
          id: string
          is_shared: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          answer_1?: string | null
          answer_2?: string | null
          answer_3?: string | null
          answer_4?: string | null
          content?: string | null
          created_at?: string | null
          diary_date: string
          diary_type: string
          emotion_id?: number | null
          id?: string
          is_shared?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          answer_1?: string | null
          answer_2?: string | null
          answer_3?: string | null
          answer_4?: string | null
          content?: string | null
          created_at?: string | null
          diary_date?: string
          diary_type?: string
          emotion_id?: number | null
          id?: string
          is_shared?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string | null
          friend_id: string
          id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          friend_id: string
          id?: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          friend_id?: string
          id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      message_reads: {
        Row: {
          id: string
          message_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
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
      notices: {
        Row: {
          category: string
          content: string
          created_at: string
          created_by: string | null
          id: number
          images: Json | null
          is_pinned: boolean | null
          published_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          created_by?: string | null
          id?: number
          images?: Json | null
          is_pinned?: boolean | null
          published_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          created_by?: string | null
          id?: number
          images?: Json | null
          is_pinned?: boolean | null
          published_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          friend_accepted_enabled: boolean
          friend_request_enabled: boolean
          notice_enabled: boolean | null
          post_comment_enabled: boolean | null
          post_like_enabled: boolean | null
          prayer_like_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          friend_accepted_enabled?: boolean
          friend_request_enabled?: boolean
          notice_enabled?: boolean | null
          post_comment_enabled?: boolean | null
          post_like_enabled?: boolean | null
          prayer_like_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          friend_accepted_enabled?: boolean
          friend_request_enabled?: boolean
          notice_enabled?: boolean | null
          post_comment_enabled?: boolean | null
          post_like_enabled?: boolean | null
          prayer_like_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string | null
          content: string | null
          created_at: string | null
          grouped_at: string | null
          id: number
          is_read: boolean | null
          metadata: Json | null
          related_id: number
          title: string
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          content?: string | null
          created_at?: string | null
          grouped_at?: string | null
          id?: number
          is_read?: boolean | null
          metadata?: Json | null
          related_id: number
          title: string
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          content?: string | null
          created_at?: string | null
          grouped_at?: string | null
          id?: number
          is_read?: boolean | null
          metadata?: Json | null
          related_id?: number
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: number
          images: Json | null
          is_anonymous: boolean | null
          is_deleted: boolean | null
          is_edited: boolean | null
          likes_count: number | null
          parent_comment_id: number | null
          post_id: number
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: number
          images?: Json | null
          is_anonymous?: boolean | null
          is_deleted?: boolean | null
          is_edited?: boolean | null
          likes_count?: number | null
          parent_comment_id?: number | null
          post_id: number
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: number
          images?: Json | null
          is_anonymous?: boolean | null
          is_deleted?: boolean | null
          is_edited?: boolean | null
          likes_count?: number | null
          parent_comment_id?: number | null
          post_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments_with_author"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts_with_author"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: number
          post_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          post_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          post_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts_with_author"
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
      prayer_participants: {
        Row: {
          created_at: string
          id: number
          prayer_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          prayer_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          prayer_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prayer_participants_prayer_id_fkey"
            columns: ["prayer_id"]
            isOneToOne: false
            referencedRelation: "prayer_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      prayer_requests: {
        Row: {
          author_id: string
          content: string
          created_at: string
          d_day: string | null
          id: number
          is_public: boolean | null
          participants_count: number | null
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          d_day?: string | null
          id?: number
          is_public?: boolean | null
          participants_count?: number | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          d_day?: string | null
          id?: number
          is_public?: boolean | null
          participants_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          achievements: Json | null
          avatar_url: string | null
          birth_date: string | null
          campus: string | null
          created_at: string
          email: string | null
          gender: string | null
          id: string
          life_verse: string | null
          marketing_agreed: boolean | null
          name: string
          nickname: string | null
          permission_level: string | null
          phone: string | null
          privacy_agreed: boolean | null
          role: string | null
          status_message: string | null
          student_id: string | null
          terms_agreed: boolean | null
          updated_at: string
        }
        Insert: {
          achievements?: Json | null
          avatar_url?: string | null
          birth_date?: string | null
          campus?: string | null
          created_at?: string
          email?: string | null
          gender?: string | null
          id: string
          life_verse?: string | null
          marketing_agreed?: boolean | null
          name: string
          nickname?: string | null
          permission_level?: string | null
          phone?: string | null
          privacy_agreed?: boolean | null
          role?: string | null
          status_message?: string | null
          student_id?: string | null
          terms_agreed?: boolean | null
          updated_at?: string
        }
        Update: {
          achievements?: Json | null
          avatar_url?: string | null
          birth_date?: string | null
          campus?: string | null
          created_at?: string
          email?: string | null
          gender?: string | null
          id?: string
          life_verse?: string | null
          marketing_agreed?: boolean | null
          name?: string
          nickname?: string | null
          permission_level?: string | null
          phone?: string | null
          privacy_agreed?: boolean | null
          role?: string | null
          status_message?: string | null
          student_id?: string | null
          terms_agreed?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string | null
          id: string
          platform: string
          token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          platform: string
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          platform?: string
          token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      recommended_praises: {
        Row: {
          created_at: string | null
          description: string | null
          external_url: string
          id: number
          is_playlist: boolean | null
          order_index: number | null
          platform: Database["public"]["Enums"]["praise_platform"] | null
          thumbnail_url: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          external_url: string
          id?: number
          is_playlist?: boolean | null
          order_index?: number | null
          platform?: Database["public"]["Enums"]["praise_platform"] | null
          thumbnail_url?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          external_url?: string
          id?: number
          is_playlist?: boolean | null
          order_index?: number | null
          platform?: Database["public"]["Enums"]["praise_platform"] | null
          thumbnail_url?: string | null
          title?: string
        }
        Relationships: []
      }
      spiritual_activities: {
        Row: {
          activity_date: string
          activity_type: string
          created_at: string
          id: number
          user_id: string
        }
        Insert: {
          activity_date: string
          activity_type: string
          created_at?: string
          id?: number
          user_id: string
        }
        Update: {
          activity_date?: string
          activity_type?: string
          created_at?: string
          id?: number
          user_id?: string
        }
        Relationships: []
      }
      spiritual_diaries: {
        Row: {
          confession: string | null
          content: string | null
          created_at: string
          diary_date: string
          gratitude: string | null
          id: number
          insight: string | null
          prayer: string | null
          scripture: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          confession?: string | null
          content?: string | null
          created_at?: string
          diary_date: string
          gratitude?: string | null
          id?: number
          insight?: string | null
          prayer?: string | null
          scripture?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          confession?: string | null
          content?: string | null
          created_at?: string
          diary_date?: string
          gratitude?: string | null
          id?: number
          insight?: string | null
          prayer?: string | null
          scripture?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      spiritual_temperature_stats: {
        Row: {
          created_at: string | null
          days_passed: number
          grade: string
          id: number
          is_public: boolean | null
          max_score: number
          month: number
          percentage: number
          score: number
          temperature: number
          updated_at: string | null
          user_id: string | null
          year: number
        }
        Insert: {
          created_at?: string | null
          days_passed: number
          grade: string
          id?: number
          is_public?: boolean | null
          max_score: number
          month: number
          percentage: number
          score: number
          temperature: number
          updated_at?: string | null
          user_id?: string | null
          year: number
        }
        Update: {
          created_at?: string | null
          days_passed?: number
          grade?: string
          id?: number
          is_public?: boolean | null
          max_score?: number
          month?: number
          percentage?: number
          score?: number
          temperature?: number
          updated_at?: string | null
          user_id?: string | null
          year?: number
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
      stories: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          author_id: string | null
          campus: string | null
          category: string
          content: string | null
          created_at: string | null
          id: string
          images: string[] | null
          is_featured: boolean | null
          rejection_reason: string | null
          status: string | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          author_id?: string | null
          campus?: string | null
          category: string
          content?: string | null
          created_at?: string | null
          id?: string
          images?: string[] | null
          is_featured?: boolean | null
          rejection_reason?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          author_id?: string | null
          campus?: string | null
          category?: string
          content?: string | null
          created_at?: string | null
          id?: string
          images?: string[] | null
          is_featured?: boolean | null
          rejection_reason?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      story_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_deleted: boolean | null
          parent_id: string | null
          story_id: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          parent_id?: string | null
          story_id?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          parent_id?: string | null
          story_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "story_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_comments_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_comments_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "story_details"
            referencedColumns: ["id"]
          },
        ]
      }
      story_participations: {
        Row: {
          created_at: string | null
          id: string
          story_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          story_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          story_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_participations_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_participations_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "story_details"
            referencedColumns: ["id"]
          },
        ]
      }
      story_reactions: {
        Row: {
          created_at: string | null
          id: string
          reaction_type: string | null
          story_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          reaction_type?: string | null
          story_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          reaction_type?: string | null
          story_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_reactions_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_reactions_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "story_details"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          created_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          created_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          created_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_stats: {
        Row: {
          chapel_view_count: number | null
          comment_count: number | null
          created_at: string | null
          friend_count: number | null
          id: string
          journal_count: number | null
          journal_max_streak: number | null
          journal_streak: number | null
          last_journal_date: string | null
          likes_received_count: number | null
          post_count: number | null
          pray_for_others_count: number | null
          prayer_count: number | null
          qt_view_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chapel_view_count?: number | null
          comment_count?: number | null
          created_at?: string | null
          friend_count?: number | null
          id?: string
          journal_count?: number | null
          journal_max_streak?: number | null
          journal_streak?: number | null
          last_journal_date?: string | null
          likes_received_count?: number | null
          post_count?: number | null
          pray_for_others_count?: number | null
          prayer_count?: number | null
          qt_view_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chapel_view_count?: number | null
          comment_count?: number | null
          created_at?: string | null
          friend_count?: number | null
          id?: string
          journal_count?: number | null
          journal_max_streak?: number | null
          journal_streak?: number | null
          last_journal_date?: string | null
          likes_received_count?: number | null
          post_count?: number | null
          pray_for_others_count?: number | null
          prayer_count?: number | null
          qt_view_count?: number | null
          updated_at?: string | null
          user_id?: string
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
      user_levels: {
        Row: {
          created_at: string | null
          current_level: number | null
          current_xp: number | null
          id: string
          total_xp: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_level?: number | null
          current_xp?: number | null
          id?: string
          total_xp?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_level?: number | null
          current_xp?: number | null
          id?: string
          total_xp?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_reactions: {
        Row: {
          created_at: string | null
          id: number
          item_id: number
          item_type: Database["public"]["Enums"]["saved_item_type"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          item_id: number
          item_type: Database["public"]["Enums"]["saved_item_type"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          item_id?: number
          item_type?: Database["public"]["Enums"]["saved_item_type"]
          user_id?: string
        }
        Relationships: []
      }
      user_saved_items: {
        Row: {
          id: number
          item_id: number
          item_thumbnail: string | null
          item_title: string
          item_type: Database["public"]["Enums"]["saved_item_type"]
          saved_at: string | null
          user_id: string
        }
        Insert: {
          id?: number
          item_id: number
          item_thumbnail?: string | null
          item_title: string
          item_type: Database["public"]["Enums"]["saved_item_type"]
          saved_at?: string | null
          user_id: string
        }
        Update: {
          id?: number
          item_id?: number
          item_thumbnail?: string | null
          item_title?: string
          item_type?: Database["public"]["Enums"]["saved_item_type"]
          saved_at?: string | null
          user_id?: string
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
      weekly_bulletins: {
        Row: {
          created_at: string | null
          created_by: string | null
          datetime: string
          id: string
          live_url: string | null
          message_title: string
          messenger: string
          passage: string
          place: string
          place_link: string | null
          songs: Json | null
          subtitle: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          word: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          datetime: string
          id?: string
          live_url?: string | null
          message_title: string
          messenger: string
          passage: string
          place: string
          place_link?: string | null
          songs?: Json | null
          subtitle?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          word?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          datetime?: string
          id?: string
          live_url?: string | null
          message_title?: string
          messenger?: string
          passage?: string
          place?: string
          place_link?: string | null
          songs?: Json | null
          subtitle?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          word?: string | null
        }
        Relationships: []
      }
      weekly_flows: {
        Row: {
          active_from: string | null
          active_until: string | null
          created_at: string | null
          description: string
          id: number
          is_active: boolean | null
          related_events: number[] | null
          related_notices: number[] | null
          related_praises: number[] | null
          sub_description: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          active_from?: string | null
          active_until?: string | null
          created_at?: string | null
          description: string
          id?: number
          is_active?: boolean | null
          related_events?: number[] | null
          related_notices?: number[] | null
          related_praises?: number[] | null
          sub_description?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          active_from?: string | null
          active_until?: string | null
          created_at?: string | null
          description?: string
          id?: number
          is_active?: boolean | null
          related_events?: number[] | null
          related_notices?: number[] | null
          related_praises?: number[] | null
          sub_description?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      xp_logs: {
        Row: {
          activity_type: string
          description: string | null
          earned_at: string | null
          id: string
          reference_id: string | null
          user_id: string
          xp_amount: number
        }
        Insert: {
          activity_type: string
          description?: string | null
          earned_at?: string | null
          id?: string
          reference_id?: string | null
          user_id: string
          xp_amount: number
        }
        Update: {
          activity_type?: string
          description?: string | null
          earned_at?: string | null
          id?: string
          reference_id?: string | null
          user_id?: string
          xp_amount?: number
        }
        Relationships: []
      }
    }
    Views: {
      community_posts_with_author: {
        Row: {
          author_campus: string | null
          author_email: string | null
          author_id: string | null
          author_name: string | null
          author_role: string | null
          category: string | null
          comments_count: number | null
          content: string | null
          created_at: string | null
          id: number | null
          images: Json | null
          is_pinned: boolean | null
          likes_count: number | null
          title: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      post_comments_hierarchical: {
        Row: {
          author_campus: string | null
          author_id: string | null
          author_name: string | null
          author_role: string | null
          content: string | null
          created_at: string | null
          depth: number | null
          id: number | null
          is_deleted: boolean | null
          is_edited: boolean | null
          likes_count: number | null
          parent_comment_id: number | null
          path: number[] | null
          post_id: number | null
          updated_at: string | null
        }
        Relationships: []
      }
      post_comments_with_author: {
        Row: {
          author_campus: string | null
          author_email: string | null
          author_id: string | null
          author_name: string | null
          author_role: string | null
          content: string | null
          created_at: string | null
          id: number | null
          is_deleted: boolean | null
          likes_count: number | null
          parent_comment_id: number | null
          post_id: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments_with_author"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts_with_author"
            referencedColumns: ["id"]
          },
        ]
      }
      story_details: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          author_avatar: string | null
          author_campus: string | null
          author_id: string | null
          author_name: string | null
          campus: string | null
          category: string | null
          comment_count: number | null
          content: string | null
          created_at: string | null
          id: string | null
          images: string[] | null
          is_featured: boolean | null
          participation_count: number | null
          reaction_count: number | null
          rejection_reason: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          view_count: number | null
        }
        Relationships: []
      }
      user_level_rankings: {
        Row: {
          avatar_url: string | null
          campus: string | null
          current_level: number | null
          name: string | null
          rank: number | null
          total_xp: number | null
          user_id: string | null
        }
        Relationships: []
      }
      user_monthly_activity_stats: {
        Row: {
          activity_count: number | null
          activity_type: string | null
          month: string | null
          user_id: string | null
        }
        Relationships: []
      }
      user_monthly_diary_stats: {
        Row: {
          active_days: number | null
          diary_count: number | null
          month: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_expired_chat_images: { Args: never; Returns: undefined }
      cleanup_old_activities: { Args: never; Returns: undefined }
      create_group_room: {
        Args: { p_admin_id: string; p_member_ids: string[]; p_name: string }
        Returns: string
      }
      create_system_message: {
        Args: { p_content: string; p_room_id: string }
        Returns: string
      }
      get_or_create_dm_room: {
        Args: { user1_id: string; user2_id: string }
        Returns: string
      }
      get_today_activity_count: {
        Args: { p_activity_type: string; p_user_id: string }
        Returns: number
      }
      get_unread_counts: {
        Args: { p_room_ids: string[]; p_user_id: string }
        Returns: {
          room_id: string
          unread_count: number
        }[]
      }
      get_user_chat_rooms: {
        Args: { p_user_id: string }
        Returns: {
          admin_id: string
          last_message_content: string
          last_message_created_at: string
          last_message_diary_id: number
          last_message_id: string
          last_message_sender_id: string
          last_message_type: string
          members: Json
          room_created_at: string
          room_id: string
          room_name: string
          room_type: string
          room_updated_at: string
          unread_count: number
        }[]
      }
      get_user_permission_level: { Args: never; Returns: string }
      hide_expired_prayer_requests: { Args: never; Returns: undefined }
      increment_story_view_count: {
        Args: { story_uuid: string }
        Returns: undefined
      }
      invite_chat_room: {
        Args: { p_room_id: string; p_user_id: string }
        Returns: undefined
      }
      is_admin_or_developer: { Args: never; Returns: boolean }
      is_developer: { Args: never; Returns: boolean }
      is_friend: {
        Args: { user_id_1: string; user_id_2: string }
        Returns: boolean
      }
      is_room_member: {
        Args: { room_id_param: string; user_id_param: string }
        Returns: boolean
      }
      is_user_room_member: {
        Args: { p_room_id: string; p_user_id: string }
        Returns: boolean
      }
      join_chat_room: {
        Args: { p_room_id: string; p_user_id: string }
        Returns: undefined
      }
      leave_chat_room: {
        Args: { p_room_id: string; p_user_id: string }
        Returns: undefined
      }
      mark_messages_as_read: {
        Args: { p_message_ids: string[]; p_user_id: string }
        Returns: undefined
      }
      read_room: {
        Args: { p_room_id: string; p_user_id: string }
        Returns: {
          joined_at: string
          last_read_at: string
        }[]
      }
      update_user_permission: {
        Args: { new_permission_level: string; target_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      curation_type: "word" | "news" | "story"
      praise_platform: "youtube" | "spotify" | "apple_music" | "other"
      saved_item_type: "praise" | "curation" | "notice"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      curation_type: ["word", "news", "story"],
      praise_platform: ["youtube", "spotify", "apple_music", "other"],
      saved_item_type: ["praise", "curation", "notice"],
    },
  },
} as const
