export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      budget_items: {
        Row: {
          budget_id: string
          created_at: string
          discount_percent: number | null
          id: string
          quantity: number
          service_id: string
          total_price: number
          unit_price: number
        }
        Insert: {
          budget_id: string
          created_at?: string
          discount_percent?: number | null
          id?: string
          quantity?: number
          service_id: string
          total_price: number
          unit_price: number
        }
        Update: {
          budget_id?: string
          created_at?: string
          discount_percent?: number | null
          id?: string
          quantity?: number
          service_id?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          budget_number: string
          company_id: string
          created_at: string
          description: string | null
          id: string
          status: string | null
          title: string
          total_amount: number | null
          updated_at: string
          user_id: string
          valid_until: string | null
        }
        Insert: {
          budget_number: string
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          status?: string | null
          title: string
          total_amount?: number | null
          updated_at?: string
          user_id: string
          valid_until?: string | null
        }
        Update: {
          budget_number?: string
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          status?: string | null
          title?: string
          total_amount?: number | null
          updated_at?: string
          user_id?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budgets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          cnpj: string | null
          contact: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          cnpj?: string | null
          contact?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          cnpj?: string | null
          contact?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      company_links: {
        Row: {
          company_id: string
          created_at: string
          id: string
          name: string
          password: string | null
          service: string | null
          updated_at: string
          url: string
          user_id: string
          username: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          name: string
          password?: string | null
          service?: string | null
          updated_at?: string
          url: string
          user_id: string
          username?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          password?: string | null
          service?: string | null
          updated_at?: string
          url?: string
          user_id?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_links_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          budget_id: string | null
          company_id: string
          content: string
          contract_number: string
          created_at: string
          end_date: string | null
          id: string
          signed_date: string | null
          start_date: string | null
          status: string | null
          title: string
          total_value: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_id?: string | null
          company_id: string
          content: string
          contract_number: string
          created_at?: string
          end_date?: string | null
          id?: string
          signed_date?: string | null
          start_date?: string | null
          status?: string | null
          title: string
          total_value?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_id?: string | null
          company_id?: string
          content?: string
          contract_number?: string
          created_at?: string
          end_date?: string | null
          id?: string
          signed_date?: string | null
          start_date?: string | null
          status?: string | null
          title?: string
          total_value?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          api_token: string | null
          base_url: string
          bucket_name: string | null
          created_at: string
          directory: string | null
          id: string
          is_active: boolean | null
          keep_logged: boolean | null
          name: string
          passive_mode: boolean | null
          password: string | null
          phone_number: string | null
          port: number | null
          region: string | null
          type: string
          updated_at: string
          use_ssl: boolean | null
          user_id: string
          username: string | null
          webhook_url: string | null
        }
        Insert: {
          api_token?: string | null
          base_url: string
          bucket_name?: string | null
          created_at?: string
          directory?: string | null
          id?: string
          is_active?: boolean | null
          keep_logged?: boolean | null
          name: string
          passive_mode?: boolean | null
          password?: string | null
          phone_number?: string | null
          port?: number | null
          region?: string | null
          type: string
          updated_at?: string
          use_ssl?: boolean | null
          user_id: string
          username?: string | null
          webhook_url?: string | null
        }
        Update: {
          api_token?: string | null
          base_url?: string
          bucket_name?: string | null
          created_at?: string
          directory?: string | null
          id?: string
          is_active?: boolean | null
          keep_logged?: boolean | null
          name?: string
          passive_mode?: boolean | null
          password?: string | null
          phone_number?: string | null
          port?: number | null
          region?: string | null
          type?: string
          updated_at?: string
          use_ssl?: boolean | null
          user_id?: string
          username?: string | null
          webhook_url?: string | null
        }
        Relationships: []
      }
      schedule_items: {
        Row: {
          company: string
          company_id: string | null
          created_at: string
          description: string | null
          due_date: string
          id: string
          schedule_type_id: string | null
          status: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company: string
          company_id?: string | null
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          schedule_type_id?: string | null
          status?: string
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string
          company_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          schedule_type_id?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_items_schedule_type_id_fkey"
            columns: ["schedule_type_id"]
            isOneToOne: false
            referencedRelation: "schedule_types"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_types: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          unit: string | null
          unit_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          unit?: string | null
          unit_price?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          unit?: string | null
          unit_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          role?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      whatsapp_conversations: {
        Row: {
          contact_name: string
          contact_phone: string
          created_at: string
          id: string
          integration_id: string
          last_message: string | null
          last_message_time: string | null
          status: string | null
          unread_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_name: string
          contact_phone: string
          created_at?: string
          id?: string
          integration_id: string
          last_message?: string | null
          last_message_time?: string | null
          status?: string | null
          unread_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_name?: string
          contact_phone?: string
          created_at?: string
          id?: string
          integration_id?: string
          last_message?: string | null
          last_message_time?: string | null
          status?: string | null
          unread_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_schedule_type_name: {
        Args: { schedule_type_id_param: string }
        Returns: string
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_master: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_master_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      integration_type:
        | "chatwoot"
        | "evolution_api"
        | "wasabi"
        | "grafana"
        | "bomcontrole"
        | "zabbix"
        | "ftp"
        | "glpi"
        | "mikrotik"
        | "unifi"
        | "google_drive"
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
  public: {
    Enums: {
      integration_type: [
        "chatwoot",
        "evolution_api",
        "wasabi",
        "grafana",
        "bomcontrole",
        "zabbix",
        "ftp",
        "glpi",
        "mikrotik",
        "unifi",
        "google_drive",
      ],
    },
  },
} as const
