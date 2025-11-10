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
  public: {
    Tables: {
      action_boards: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      action_card_items: {
        Row: {
          card_id: string
          created_at: string
          id: string
          is_completed: boolean
          position: number
          text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          card_id: string
          created_at?: string
          id?: string
          is_completed?: boolean
          position?: number
          text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          card_id?: string
          created_at?: string
          id?: string
          is_completed?: boolean
          position?: number
          text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_card_items_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "action_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      action_cards: {
        Row: {
          color: string | null
          column_id: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          position: number
          priority: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          column_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number
          priority?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          column_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number
          priority?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_cards_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "action_columns"
            referencedColumns: ["id"]
          },
        ]
      }
      action_columns: {
        Row: {
          board_id: string
          color: string | null
          created_at: string
          id: string
          name: string
          position: number
          updated_at: string
          user_id: string
        }
        Insert: {
          board_id: string
          color?: string | null
          created_at?: string
          id?: string
          name: string
          position?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          board_id?: string
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          position?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_columns_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "action_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      annotations: {
        Row: {
          annotation: string | null
          company_id: string | null
          created_at: string
          gera_link: boolean | null
          id: string
          name: string
          notes: string | null
          service: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          annotation?: string | null
          company_id?: string | null
          created_at?: string
          gera_link?: boolean | null
          id?: string
          name: string
          notes?: string | null
          service?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          annotation?: string | null
          company_id?: string | null
          created_at?: string
          gera_link?: boolean | null
          id?: string
          name?: string
          notes?: string | null
          service?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "annotations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
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
      chatwoot_events: {
        Row: {
          account_id: number
          conversation_id: number
          created_at: string | null
          event_data: Json
          event_type: string
          id: string
          integration_id: string
          processed: boolean | null
        }
        Insert: {
          account_id: number
          conversation_id: number
          created_at?: string | null
          event_data: Json
          event_type: string
          id?: string
          integration_id: string
          processed?: boolean | null
        }
        Update: {
          account_id?: number
          conversation_id?: number
          created_at?: string | null
          event_data?: Json
          event_type?: string
          id?: string
          integration_id?: string
          processed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "chatwoot_events_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
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
      cron_execution_locks: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          lock_name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at: string
          id?: string
          lock_name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          lock_name?: string
        }
        Relationships: []
      }
      cron_job_logs: {
        Row: {
          created_at: string
          details: Json | null
          execution_id: string | null
          id: string
          job_name: string
          status: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          execution_id?: string | null
          id?: string
          job_name: string
          status: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          execution_id?: string | null
          id?: string
          job_name?: string
          status?: string
        }
        Relationships: []
      }
      glpi_scheduled_tickets: {
        Row: {
          assign_group_id: number | null
          assign_user_id: number | null
          category_id: number | null
          content: string
          created_at: string
          cron_expression: string
          entity_id: number
          execution_count: number
          id: string
          impact: number
          is_active: boolean
          last_execution: string | null
          name: string
          next_execution: string | null
          priority: number
          requester_user_id: number | null
          settings: Json | null
          title: string
          type: number
          updated_at: string
          urgency: number
          user_id: string
        }
        Insert: {
          assign_group_id?: number | null
          assign_user_id?: number | null
          category_id?: number | null
          content: string
          created_at?: string
          cron_expression: string
          entity_id?: number
          execution_count?: number
          id?: string
          impact?: number
          is_active?: boolean
          last_execution?: string | null
          name: string
          next_execution?: string | null
          priority?: number
          requester_user_id?: number | null
          settings?: Json | null
          title: string
          type?: number
          updated_at?: string
          urgency?: number
          user_id: string
        }
        Update: {
          assign_group_id?: number | null
          assign_user_id?: number | null
          category_id?: number | null
          content?: string
          created_at?: string
          cron_expression?: string
          entity_id?: number
          execution_count?: number
          id?: string
          impact?: number
          is_active?: boolean
          last_execution?: string | null
          name?: string
          next_execution?: string | null
          priority?: number
          requester_user_id?: number | null
          settings?: Json | null
          title?: string
          type?: number
          updated_at?: string
          urgency?: number
          user_id?: string
        }
        Relationships: []
      }
      integrations: {
        Row: {
          api_token: string | null
          base_url: string | null
          bucket_name: string | null
          created_at: string
          directory: string | null
          id: string
          instance_name: string | null
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
          user_token: string | null
          username: string | null
          webhook_url: string | null
        }
        Insert: {
          api_token?: string | null
          base_url?: string | null
          bucket_name?: string | null
          created_at?: string
          directory?: string | null
          id?: string
          instance_name?: string | null
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
          user_token?: string | null
          username?: string | null
          webhook_url?: string | null
        }
        Update: {
          api_token?: string | null
          base_url?: string | null
          bucket_name?: string | null
          created_at?: string
          directory?: string | null
          id?: string
          instance_name?: string | null
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
          user_token?: string | null
          username?: string | null
          webhook_url?: string | null
        }
        Relationships: []
      }
      passwords: {
        Row: {
          company_id: string | null
          created_at: string
          gera_link: boolean | null
          id: string
          name: string
          notes: string | null
          password: string | null
          service: string | null
          updated_at: string
          url: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          gera_link?: boolean | null
          id?: string
          name: string
          notes?: string | null
          password?: string | null
          service?: string | null
          updated_at?: string
          url?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          gera_link?: boolean | null
          id?: string
          name?: string
          notes?: string | null
          password?: string | null
          service?: string | null
          updated_at?: string
          url?: string | null
          user_id?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "passwords_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_schedules: {
        Row: {
          client_id: string | null
          color: string | null
          created_at: string
          days_of_week: number[]
          description: string | null
          id: string
          is_active: boolean | null
          location: string | null
          name: string
          system_name: string
          time_hour: number
          time_minute: number
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          color?: string | null
          created_at?: string
          days_of_week: number[]
          description?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          name: string
          system_name: string
          time_hour: number
          time_minute?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          color?: string | null
          created_at?: string
          days_of_week?: number[]
          description?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          name?: string
          system_name?: string
          time_hour?: number
          time_minute?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_recurring_schedules_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_items: {
        Row: {
          color: string | null
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
          color?: string | null
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
          color?: string | null
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
      schedule_services: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      scheduled_reports: {
        Row: {
          created_at: string
          cron_expression: string
          execution_count: number
          id: string
          is_active: boolean
          last_execution: string | null
          name: string
          next_execution: string | null
          phone_number: string
          report_type: string
          settings: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cron_expression: string
          execution_count?: number
          id?: string
          is_active?: boolean
          last_execution?: string | null
          name: string
          next_execution?: string | null
          phone_number: string
          report_type: string
          settings?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cron_expression?: string
          execution_count?: number
          id?: string
          is_active?: boolean
          last_execution?: string | null
          name?: string
          next_execution?: string | null
          phone_number?: string
          report_type?: string
          settings?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_reports_logs: {
        Row: {
          created_at: string
          error_details: string | null
          execution_date: string
          execution_time_ms: number | null
          id: string
          message_content: string | null
          message_sent: boolean
          phone_number: string
          report_id: string
          status: string
          user_id: string
          whatsapp_response: Json | null
        }
        Insert: {
          created_at?: string
          error_details?: string | null
          execution_date?: string
          execution_time_ms?: number | null
          id?: string
          message_content?: string | null
          message_sent?: boolean
          phone_number: string
          report_id: string
          status: string
          user_id: string
          whatsapp_response?: Json | null
        }
        Update: {
          created_at?: string
          error_details?: string | null
          execution_date?: string
          execution_time_ms?: number | null
          id?: string
          message_content?: string | null
          message_sent?: boolean
          phone_number?: string
          report_id?: string
          status?: string
          user_id?: string
          whatsapp_response?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_reports_logs_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "scheduled_reports"
            referencedColumns: ["id"]
          },
        ]
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
      system_settings: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_type: string
          setting_value: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_type?: string
          setting_value: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_type?: string
          setting_value?: string
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
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
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
      whatsapp_message_templates: {
        Row: {
          body: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          subject: string
          template_type: string
          updated_at: string
          user_id: string
          variables: Json | null
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          subject: string
          template_type: string
          updated_at?: string
          user_id: string
          variables?: Json | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          subject?: string
          template_type?: string
          updated_at?: string
          user_id?: string
          variables?: Json | null
        }
        Relationships: []
      }
      zabbix_webhooks: {
        Row: {
          actions: Json
          created_at: string
          id: string
          is_active: boolean
          last_triggered: string | null
          name: string
          trigger_count: number
          trigger_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actions?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          last_triggered?: string | null
          name: string
          trigger_count?: number
          trigger_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actions?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          last_triggered?: string | null
          name?: string
          trigger_count?: number
          trigger_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_next_execution: {
        Args: { cron_expr: string; from_time?: string }
        Returns: string
      }
      get_schedule_type_name: {
        Args: { schedule_type_id_param: string }
        Returns: string
      }
      get_user_role: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_master: { Args: { user_id: string }; Returns: boolean }
      is_master_user: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "master" | "admin" | "user"
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
        | "bacula"
        | "hostinger"
        | "guacamole"
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
      app_role: ["master", "admin", "user"],
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
        "bacula",
        "hostinger",
        "guacamole",
      ],
    },
  },
} as const
