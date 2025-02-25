export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          billing_status: string
          stores_limit: number
          products_limit: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          billing_status?: string
          stores_limit?: number
          products_limit?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          billing_status?: string
          stores_limit?: number
          products_limit?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      stores: {
        Row: {
          id: string
          name: string
          user_id: string
          platform: "aliexpress" | "shopify" | "other"
          url: string | null
          api_key: string | null
          api_secret: string | null
          api_version: string | null
          products_count: number
          orders_count: number
          last_sync: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          user_id: string
          platform: "aliexpress" | "shopify" | "other"
          url?: string | null
          api_key?: string | null
          api_secret?: string | null
          api_version?: string | null
          products_count?: number
          orders_count?: number
          last_sync?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          user_id?: string
          platform?: "aliexpress" | "shopify" | "other"
          url?: string | null
          api_key?: string | null
          api_secret?: string | null
          api_version?: string | null
          products_count?: number
          orders_count?: number
          last_sync?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stores_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      products: {
        Row: {
          id: string
          store_id: string
          title: string
          description: string | null
          price: number
          compare_at_price: number | null
          images: string[]
          original_url: string | null
          original_platform: "aliexpress" | "shopify" | "other" | null
          shopify_product_id: string | null
          shopify_product_url: string | null
          stock: number
          status: "imported" | "editing" | "ready" | "published" | "archived"
          reviews_count: number
          average_rating: number | null
          tags: string[] | null
          variants: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          title: string
          description?: string | null
          price: number
          compare_at_price?: number | null
          images: string[]
          original_url?: string | null
          original_platform?: "aliexpress" | "shopify" | "other" | null
          shopify_product_id?: string | null
          shopify_product_url?: string | null
          stock?: number
          status?: "imported" | "editing" | "ready" | "published" | "archived"
          reviews_count?: number
          average_rating?: number | null
          tags?: string[] | null
          variants?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          title?: string
          description?: string | null
          price?: number
          compare_at_price?: number | null
          images?: string[]
          original_url?: string | null
          original_platform?: "aliexpress" | "shopify" | "other" | null
          shopify_product_id?: string | null
          shopify_product_url?: string | null
          stock?: number
          status?: "imported" | "editing" | "ready" | "published" | "archived"
          reviews_count?: number
          average_rating?: number | null
          tags?: string[] | null
          variants?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            referencedRelation: "stores"
            referencedColumns: ["id"]
          }
        ]
      }
      reviews: {
        Row: {
          id: string
          product_id: string
          author: string
          rating: number
          content: string | null
          date: string | null
          images: string[] | null
          is_selected: boolean
          is_published: boolean
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          author: string
          rating: number
          content?: string | null
          date?: string | null
          images?: string[] | null
          is_selected?: boolean
          is_published?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          author?: string
          rating?: number
          content?: string | null
          date?: string | null
          images?: string[] | null
          is_selected?: boolean
          is_published?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      publication_history: {
        Row: {
          id: string
          product_id: string
          store_id: string
          published_at: string
          status: string | null
          shopify_response: Json | null
        }
        Insert: {
          id?: string
          product_id: string
          store_id: string
          published_at?: string
          status?: string | null
          shopify_response?: Json | null
        }
        Update: {
          id?: string
          product_id?: string
          store_id?: string
          published_at?: string
          status?: string | null
          shopify_response?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "publication_history_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publication_history_store_id_fkey"
            columns: ["store_id"]
            referencedRelation: "stores"
            referencedColumns: ["id"]
          }
        ]
      }
      user_settings: {
        Row: {
          user_id: string
          default_language: string | null
          auto_translate: boolean
          auto_enhance: boolean
          default_store: string | null
          ui_preferences: Json | null
          updated_at: string
        }
        Insert: {
          user_id: string
          default_language?: string | null
          auto_translate?: boolean
          auto_enhance?: boolean
          default_store?: string | null
          ui_preferences?: Json | null
          updated_at?: string
        }
        Update: {
          user_id?: string
          default_language?: string | null
          auto_translate?: boolean
          auto_enhance?: boolean
          default_store?: string | null
          ui_preferences?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_default_store_fkey"
            columns: ["default_store"]
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      platform_type: "aliexpress" | "shopify" | "other"
      product_status: "imported" | "editing" | "ready" | "published" | "archived"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 