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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      anonymized_exports: {
        Row: {
          condition_category: string | null
          dataset_version: string | null
          exported_at: string | null
          fields_included: Json | null
          id: string
          organization_id: string | null
          patient_id: string | null
        }
        Insert: {
          condition_category?: string | null
          dataset_version?: string | null
          exported_at?: string | null
          fields_included?: Json | null
          id?: string
          organization_id?: string | null
          patient_id?: string | null
        }
        Update: {
          condition_category?: string | null
          dataset_version?: string | null
          exported_at?: string | null
          fields_included?: Json | null
          id?: string
          organization_id?: string | null
          patient_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anonymized_exports_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          completed: boolean | null
          created_at: string | null
          created_by: string | null
          datetime: string | null
          duration_minutes: number | null
          id: string
          organization_id: string | null
          location: string | null
          notes: string | null
          patient_id: string | null
          prep_summary: string | null
          provider_name: string | null
          provider_specialty: string | null
          source: string | null
          title: string | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          created_by?: string | null
          datetime?: string | null
          duration_minutes?: number | null
          id?: string
          organization_id?: string | null
          location?: string | null
          notes?: string | null
          patient_id?: string | null
          prep_summary?: string | null
          provider_name?: string | null
          provider_specialty?: string | null
          source?: string | null
          title?: string | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          created_by?: string | null
          datetime?: string | null
          duration_minutes?: number | null
          id?: string
          organization_id?: string | null
          location?: string | null
          notes?: string | null
          patient_id?: string | null
          prep_summary?: string | null
          provider_name?: string | null
          provider_specialty?: string | null
          source?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string | null
          created_at: string | null
          id: string
          organization_id: string | null
          ip_address: string | null
          patient_id: string | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
          ip_address?: string | null
          patient_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
          ip_address?: string | null
          patient_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_connections: {
        Row: {
          access_token: string | null
          connected_at: string | null
          id: string
          organization_id: string | null
          last_synced_at: string | null
          provider: string | null
          refresh_token: string | null
          user_id: string | null
        }
        Insert: {
          access_token?: string | null
          connected_at?: string | null
          id?: string
          organization_id?: string | null
          last_synced_at?: string | null
          provider?: string | null
          refresh_token?: string | null
          user_id?: string | null
        }
        Update: {
          access_token?: string | null
          connected_at?: string | null
          id?: string
          organization_id?: string | null
          last_synced_at?: string | null
          provider?: string | null
          refresh_token?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      care_relationships: {
        Row: {
          accepted: boolean | null
          accepted_at: string | null
          access_level: string | null
          can_export: boolean | null
          can_log: boolean | null
          id: string
          invited_at: string | null
          invited_by: string | null
          last_accessed_at: string | null
          organization_id: string | null
          patient_id: string | null
          relationship_type: string | null
          user_id: string | null
        }
        Insert: {
          accepted?: boolean | null
          accepted_at?: string | null
          access_level?: string | null
          can_export?: boolean | null
          can_log?: boolean | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          last_accessed_at?: string | null
          organization_id?: string | null
          patient_id?: string | null
          relationship_type?: string | null
          user_id?: string | null
        }
        Update: {
          accepted?: boolean | null
          accepted_at?: string | null
          access_level?: string | null
          can_export?: boolean | null
          can_log?: boolean | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          last_accessed_at?: string | null
          organization_id?: string | null
          patient_id?: string | null
          relationship_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "care_relationships_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_relationships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_relationships_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_relationships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          document_id: string | null
          id: string
          organization_id: string | null
          patient_id: string | null
          role: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          document_id?: string | null
          id?: string
          organization_id?: string | null
          patient_id?: string | null
          role: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          document_id?: string | null
          id?: string
          organization_id?: string | null
          patient_id?: string | null
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      condition_templates: {
        Row: {
          ai_context: string | null
          care_team_roles: Json | null
          category: string
          created_at: string | null
          document_types: Json | null
          id: string
          is_active: boolean | null
          name: string
          research_fields: Json | null
          symptom_questions: Json | null
          symptom_vocabulary: Json | null
          trial_filters: Json | null
        }
        Insert: {
          ai_context?: string | null
          care_team_roles?: Json | null
          category: string
          created_at?: string | null
          document_types?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          research_fields?: Json | null
          symptom_questions?: Json | null
          symptom_vocabulary?: Json | null
          trial_filters?: Json | null
        }
        Update: {
          ai_context?: string | null
          care_team_roles?: Json | null
          category?: string
          created_at?: string | null
          document_types?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          research_fields?: Json | null
          symptom_questions?: Json | null
          symptom_vocabulary?: Json | null
          trial_filters?: Json | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          analysis_status: string | null
          analyzed_at: string | null
          created_at: string | null
          document_category: string | null
          exported_at: string | null
          file_name: string | null
          file_path: string | null
          file_type: string | null
          file_url: string | null
          flagged: boolean | null
          id: string
          mime_type: string | null
          organization_id: string | null
          key_findings: Json | null
          patient_id: string | null
          share_research: boolean | null
          share_with_care_team: boolean | null
          summary: string | null
          title: string | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          analysis_status?: string | null
          analyzed_at?: string | null
          created_at?: string | null
          document_category?: string | null
          exported_at?: string | null
          file_name?: string | null
          file_path?: string | null
          file_type?: string | null
          file_url?: string | null
          flagged?: boolean | null
          id?: string
          mime_type?: string | null
          organization_id?: string | null
          key_findings?: Json | null
          patient_id?: string | null
          share_research?: boolean | null
          share_with_care_team?: boolean | null
          summary?: string | null
          title?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          analysis_status?: string | null
          analyzed_at?: string | null
          created_at?: string | null
          document_category?: string | null
          exported_at?: string | null
          file_name?: string | null
          file_path?: string | null
          file_type?: string | null
          file_url?: string | null
          flagged?: boolean | null
          id?: string
          mime_type?: string | null
          organization_id?: string | null
          key_findings?: Json | null
          patient_id?: string | null
          share_research?: boolean | null
          share_with_care_team?: boolean | null
          summary?: string | null
          title?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          added_by: string | null
          created_at: string | null
          dose: string | null
          end_date: string | null
          frequency: string | null
          generic_name: string | null
          id: string
          organization_id: string | null
          indication: string | null
          is_active: boolean | null
          name: string
          notes: string | null
          patient_id: string | null
          prescriber: string | null
          route: string | null
          start_date: string | null
          unit: string | null
        }
        Insert: {
          added_by?: string | null
          created_at?: string | null
          dose?: string | null
          end_date?: string | null
          frequency?: string | null
          generic_name?: string | null
          id?: string
          organization_id?: string | null
          indication?: string | null
          is_active?: boolean | null
          name: string
          notes?: string | null
          patient_id?: string | null
          prescriber?: string | null
          route?: string | null
          start_date?: string | null
          unit?: string | null
        }
        Update: {
          added_by?: string | null
          created_at?: string | null
          dose?: string | null
          end_date?: string | null
          frequency?: string | null
          generic_name?: string | null
          id?: string
          organization_id?: string | null
          indication?: string | null
          is_active?: boolean | null
          name?: string
          notes?: string | null
          patient_id?: string | null
          prescriber?: string | null
          route?: string | null
          start_date?: string | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medications_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          organization_id: string | null
          message: string | null
          patient_id: string | null
          read: boolean | null
          title: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
          message?: string | null
          patient_id?: string | null
          read?: boolean | null
          title?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
          message?: string | null
          patient_id?: string | null
          read?: boolean | null
          title?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_patients: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          organization_id: string | null
          patient_id: string | null
          status: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          organization_id?: string | null
          patient_id?: string | null
          status?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          organization_id?: string | null
          patient_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_patients_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_patients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_patients_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          max_patients: number | null
          name: string
          subscription_status: string | null
          subscription_tier: string | null
          type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          max_patients?: number | null
          name: string
          subscription_status?: string | null
          subscription_tier?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          max_patients?: number | null
          name?: string
          subscription_status?: string | null
          subscription_tier?: string | null
          type?: string | null
        }
        Relationships: []
      }
      patients: {
        Row: {
          condition_template_id: string | null
          created_at: string | null
          created_by: string | null
          custom_diagnosis: string | null
          diagnosis_date: string | null
          dob: string | null
          id: string
          organization_id: string | null
          name: string
          notes: string | null
          photo_url: string | null
          primary_language: string | null
          sex: string | null
          status: string | null
        }
        Insert: {
          condition_template_id?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_diagnosis?: string | null
          diagnosis_date?: string | null
          dob?: string | null
          id?: string
          organization_id?: string | null
          name: string
          notes?: string | null
          photo_url?: string | null
          primary_language?: string | null
          sex?: string | null
          status?: string | null
        }
        Update: {
          condition_template_id?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_diagnosis?: string | null
          diagnosis_date?: string | null
          dob?: string | null
          id?: string
          organization_id?: string | null
          name?: string
          notes?: string | null
          photo_url?: string | null
          primary_language?: string | null
          sex?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_condition_template_id_fkey"
            columns: ["condition_template_id"]
            isOneToOne: false
            referencedRelation: "condition_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      research_consent: {
        Row: {
          consent_version: string | null
          consented_at: string | null
          id: string
          organization_id: string | null
          opted_in: boolean | null
          patient_id: string | null
          revoked_at: string | null
          share_docs: boolean | null
          share_labs: boolean | null
          share_medications: boolean | null
          share_symptoms: boolean | null
          user_id: string | null
        }
        Insert: {
          consent_version?: string | null
          consented_at?: string | null
          id?: string
          organization_id?: string | null
          opted_in?: boolean | null
          patient_id?: string | null
          revoked_at?: string | null
          share_docs?: boolean | null
          share_labs?: boolean | null
          share_medications?: boolean | null
          share_symptoms?: boolean | null
          user_id?: string | null
        }
        Update: {
          consent_version?: string | null
          consented_at?: string | null
          id?: string
          organization_id?: string | null
          opted_in?: boolean | null
          patient_id?: string | null
          revoked_at?: string | null
          share_docs?: boolean | null
          share_labs?: boolean | null
          share_medications?: boolean | null
          share_symptoms?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "research_consent_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_consent_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      symptom_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string | null
          data: Json | null
          id: string
          organization_id: string | null
          message: string | null
          patient_id: string | null
          severity: string | null
          triggered_at: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string | null
          data?: Json | null
          id?: string
          organization_id?: string | null
          message?: string | null
          patient_id?: string | null
          severity?: string | null
          triggered_at?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string | null
          data?: Json | null
          id?: string
          organization_id?: string | null
          message?: string | null
          patient_id?: string | null
          severity?: string | null
          triggered_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "symptom_alerts_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "symptom_alerts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      symptom_logs: {
        Row: {
          ai_summary: string | null
          condition_context: string | null
          created_at: string | null
          doctor_statement: string | null
          flagged: boolean | null
          id: string
          organization_id: string | null
          logged_by: string | null
          overall_severity: number | null
          patient_id: string | null
          responses: Json | null
          symptoms: Json | null
        }
        Insert: {
          ai_summary?: string | null
          condition_context?: string | null
          created_at?: string | null
          doctor_statement?: string | null
          flagged?: boolean | null
          id?: string
          organization_id?: string | null
          logged_by?: string | null
          overall_severity?: number | null
          patient_id?: string | null
          responses?: Json | null
          symptoms?: Json | null
        }
        Update: {
          ai_summary?: string | null
          condition_context?: string | null
          created_at?: string | null
          doctor_statement?: string | null
          flagged?: boolean | null
          id?: string
          organization_id?: string | null
          logged_by?: string | null
          overall_severity?: number | null
          patient_id?: string | null
          responses?: Json | null
          symptoms?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "symptom_logs_logged_by_fkey"
            columns: ["logged_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "symptom_logs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      trial_saves: {
        Row: {
          distance_miles: number | null
          id: string
          organization_id: string | null
          location: string | null
          match_criteria: Json | null
          patient_id: string | null
          phase: string | null
          saved_at: string | null
          saved_by: string | null
          status: string | null
          trial_id: string | null
          trial_name: string | null
        }
        Insert: {
          distance_miles?: number | null
          id?: string
          organization_id?: string | null
          location?: string | null
          match_criteria?: Json | null
          patient_id?: string | null
          phase?: string | null
          saved_at?: string | null
          saved_by?: string | null
          status?: string | null
          trial_id?: string | null
          trial_name?: string | null
        }
        Update: {
          distance_miles?: number | null
          id?: string
          organization_id?: string | null
          location?: string | null
          match_criteria?: Json | null
          patient_id?: string | null
          phase?: string | null
          saved_at?: string | null
          saved_by?: string | null
          status?: string | null
          trial_id?: string | null
          trial_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trial_saves_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_saves_saved_by_fkey"
            columns: ["saved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          language: string | null
          organization_id: string | null
          role: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          language?: string | null
          organization_id?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          language?: string | null
          organization_id?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
