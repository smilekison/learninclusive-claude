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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      accessibility_audit_log: {
        Row: {
          accessibility_feature: string
          action_type: string
          context_data: Json | null
          created_at: string | null
          id: string
          screen_reader_detected: boolean | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          accessibility_feature: string
          action_type: string
          context_data?: Json | null
          created_at?: string | null
          id?: string
          screen_reader_detected?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          accessibility_feature?: string
          action_type?: string
          context_data?: Json | null
          created_at?: string | null
          id?: string
          screen_reader_detected?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accessibility_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_analytics: {
        Row: {
          assignment_id: string
          id: string
          metadata: Json | null
          metric_name: string
          metric_value: number | null
          recorded_at: string | null
          student_id: string | null
        }
        Insert: {
          assignment_id: string
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_value?: number | null
          recorded_at?: string | null
          student_id?: string | null
        }
        Update: {
          assignment_id?: string
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_value?: number | null
          recorded_at?: string | null
          student_id?: string | null
        }
        Relationships: []
      }
      assignment_group_memberships: {
        Row: {
          group_id: string
          id: string
          is_active: boolean | null
          joined_at: string | null
          role: string | null
          student_id: string
        }
        Insert: {
          group_id: string
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          role?: string | null
          student_id: string
        }
        Update: {
          group_id?: string
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          role?: string | null
          student_id?: string
        }
        Relationships: []
      }
      assignment_groups: {
        Row: {
          assignment_id: string
          created_at: string | null
          created_by: string
          id: string
          is_active: boolean | null
          max_members: number | null
          name: string
          updated_at: string | null
        }
        Insert: {
          assignment_id: string
          created_at?: string | null
          created_by: string
          id?: string
          is_active?: boolean | null
          max_members?: number | null
          name: string
          updated_at?: string | null
        }
        Update: {
          assignment_id?: string
          created_at?: string | null
          created_by?: string
          id?: string
          is_active?: boolean | null
          max_members?: number | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      assignment_resources: {
        Row: {
          assignment_id: string
          created_at: string | null
          created_by: string
          description: string | null
          display_order: number | null
          file_path: string | null
          id: string
          is_required: boolean | null
          metadata: Json | null
          resource_type: string
          resource_url: string | null
          title: string
        }
        Insert: {
          assignment_id: string
          created_at?: string | null
          created_by: string
          description?: string | null
          display_order?: number | null
          file_path?: string | null
          id?: string
          is_required?: boolean | null
          metadata?: Json | null
          resource_type: string
          resource_url?: string | null
          title: string
        }
        Update: {
          assignment_id?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          display_order?: number | null
          file_path?: string | null
          id?: string
          is_required?: boolean | null
          metadata?: Json | null
          resource_type?: string
          resource_url?: string | null
          title?: string
        }
        Relationships: []
      }
      assignment_rubrics: {
        Row: {
          assignment_id: string
          created_at: string | null
          created_by: string
          criteria: Json
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          total_points: number | null
          updated_at: string | null
        }
        Insert: {
          assignment_id: string
          created_at?: string | null
          created_by: string
          criteria?: Json
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          total_points?: number | null
          updated_at?: string | null
        }
        Update: {
          assignment_id?: string
          created_at?: string | null
          created_by?: string
          criteria?: Json
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          total_points?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          attempt_number: number | null
          auto_grade_result: Json | null
          feedback: string | null
          file_path: string | null
          graded_at: string | null
          graded_by: string | null
          grading_notes: string | null
          group_id: string | null
          id: string
          late_submission: boolean | null
          learning_objectives_met: Json | null
          peer_reviews: Json | null
          plagiarism_score: number | null
          rubric_scores: Json | null
          score: number | null
          student_id: string
          submission_metadata: Json | null
          submission_quality: string | null
          submission_status:
            | Database["public"]["Enums"]["submission_status"]
            | null
          submission_text: string | null
          submitted_at: string
          time_spent_minutes: number | null
          updated_at: string
          version_number: number | null
        }
        Insert: {
          assignment_id: string
          attempt_number?: number | null
          auto_grade_result?: Json | null
          feedback?: string | null
          file_path?: string | null
          graded_at?: string | null
          graded_by?: string | null
          grading_notes?: string | null
          group_id?: string | null
          id?: string
          late_submission?: boolean | null
          learning_objectives_met?: Json | null
          peer_reviews?: Json | null
          plagiarism_score?: number | null
          rubric_scores?: Json | null
          score?: number | null
          student_id: string
          submission_metadata?: Json | null
          submission_quality?: string | null
          submission_status?:
            | Database["public"]["Enums"]["submission_status"]
            | null
          submission_text?: string | null
          submitted_at?: string
          time_spent_minutes?: number | null
          updated_at?: string
          version_number?: number | null
        }
        Update: {
          assignment_id?: string
          attempt_number?: number | null
          auto_grade_result?: Json | null
          feedback?: string | null
          file_path?: string | null
          graded_at?: string | null
          graded_by?: string | null
          grading_notes?: string | null
          group_id?: string | null
          id?: string
          late_submission?: boolean | null
          learning_objectives_met?: Json | null
          peer_reviews?: Json | null
          plagiarism_score?: number | null
          rubric_scores?: Json | null
          score?: number | null
          student_id?: string
          submission_metadata?: Json | null
          submission_quality?: string | null
          submission_status?:
            | Database["public"]["Enums"]["submission_status"]
            | null
          submission_text?: string | null
          submitted_at?: string
          time_spent_minutes?: number | null
          updated_at?: string
          version_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_graded_by_fkey"
            columns: ["graded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          ai_assistance_config: Json | null
          allow_late_submissions: boolean | null
          allowed_file_types: string[] | null
          analytics_config: Json | null
          assignment_type: Database["public"]["Enums"]["assignment_type"] | null
          auto_grade: boolean | null
          created_at: string
          description: string | null
          due_date: string | null
          group_assignment: boolean | null
          id: string
          instructions_rich_text: string | null
          is_active: boolean | null
          late_penalty_percent: number | null
          max_attempts: number | null
          max_group_size: number | null
          max_score: number | null
          peer_review: boolean | null
          plagiarism_check: boolean | null
          resources_json: Json | null
          rubric_id: string | null
          show_grades_to_students: boolean | null
          subject_id: string
          submission_types: string[] | null
          time_limit_minutes: number | null
          title: string
          updated_at: string
        }
        Insert: {
          ai_assistance_config?: Json | null
          allow_late_submissions?: boolean | null
          allowed_file_types?: string[] | null
          analytics_config?: Json | null
          assignment_type?:
            | Database["public"]["Enums"]["assignment_type"]
            | null
          auto_grade?: boolean | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          group_assignment?: boolean | null
          id?: string
          instructions_rich_text?: string | null
          is_active?: boolean | null
          late_penalty_percent?: number | null
          max_attempts?: number | null
          max_group_size?: number | null
          max_score?: number | null
          peer_review?: boolean | null
          plagiarism_check?: boolean | null
          resources_json?: Json | null
          rubric_id?: string | null
          show_grades_to_students?: boolean | null
          subject_id: string
          submission_types?: string[] | null
          time_limit_minutes?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          ai_assistance_config?: Json | null
          allow_late_submissions?: boolean | null
          allowed_file_types?: string[] | null
          analytics_config?: Json | null
          assignment_type?:
            | Database["public"]["Enums"]["assignment_type"]
            | null
          auto_grade?: boolean | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          group_assignment?: boolean | null
          id?: string
          instructions_rich_text?: string | null
          is_active?: boolean | null
          late_penalty_percent?: number | null
          max_attempts?: number | null
          max_group_size?: number | null
          max_score?: number | null
          peer_review?: boolean | null
          plagiarism_check?: boolean | null
          resources_json?: Json | null
          rubric_id?: string | null
          show_grades_to_students?: boolean | null
          subject_id?: string
          submission_types?: string[] | null
          time_limit_minutes?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          school_id: string | null
          teacher_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          school_id?: string | null
          teacher_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          school_id?: string | null
          teacher_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deleted_items: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          item_details: string | null
          item_id: string
          item_name: string
          item_type: string
          original_data: Json
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          item_details?: string | null
          item_id: string
          item_name: string
          item_type: string
          original_data: Json
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          item_details?: string | null
          item_id?: string
          item_name?: string
          item_type?: string
          original_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "deleted_items_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_invitations: {
        Row: {
          additional_data: Json | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: string
          token: string
          used: boolean | null
        }
        Insert: {
          additional_data?: Json | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role: string
          token: string
          used?: boolean | null
        }
        Update: {
          additional_data?: Json | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: string
          token?: string
          used?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "email_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      grading_rubrics: {
        Row: {
          assignment_id: string
          created_at: string
          created_by: string
          criteria: Json
          id: string
          name: string
          total_points: number
          updated_at: string
        }
        Insert: {
          assignment_id: string
          created_at?: string
          created_by: string
          criteria?: Json
          id?: string
          name: string
          total_points?: number
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          created_at?: string
          created_by?: string
          criteria?: Json
          id?: string
          name?: string
          total_points?: number
          updated_at?: string
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          accessibility_settings: Json | null
          completed_at: string | null
          created_at: string | null
          id: string
          last_accessed: string | null
          lesson_id: string
          notes: string | null
          progress_percentage: number | null
          student_id: string
          time_spent_minutes: number | null
          updated_at: string | null
        }
        Insert: {
          accessibility_settings?: Json | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          last_accessed?: string | null
          lesson_id: string
          notes?: string | null
          progress_percentage?: number | null
          student_id: string
          time_spent_minutes?: number | null
          updated_at?: string | null
        }
        Update: {
          accessibility_settings?: Json | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          last_accessed?: string | null
          lesson_id?: string
          notes?: string | null
          progress_percentage?: number | null
          student_id?: string
          time_spent_minutes?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          accessibility_features: Json | null
          content: string | null
          created_at: string
          description: string | null
          difficulty_level: string | null
          estimated_duration_minutes: number | null
          id: string
          interactive_elements: Json | null
          learning_objectives: Json | null
          lesson_order: number | null
          prerequisites: Json | null
          rich_content: Json | null
          subject_id: string
          title: string
          updated_at: string
        }
        Insert: {
          accessibility_features?: Json | null
          content?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          interactive_elements?: Json | null
          learning_objectives?: Json | null
          lesson_order?: number | null
          prerequisites?: Json | null
          rich_content?: Json | null
          subject_id: string
          title: string
          updated_at?: string
        }
        Update: {
          accessibility_features?: Json | null
          content?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          interactive_elements?: Json | null
          learning_objectives?: Json | null
          lesson_order?: number | null
          prerequisites?: Json | null
          rich_content?: Json | null
          subject_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          created_at: string
          description: string | null
          file_path: string | null
          file_type: string | null
          id: string
          lesson_id: string | null
          subject_id: string | null
          title: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_path?: string | null
          file_type?: string | null
          id?: string
          lesson_id?: string | null
          subject_id?: string | null
          title: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_path?: string | null
          file_type?: string | null
          id?: string
          lesson_id?: string | null
          subject_id?: string | null
          title?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_student_relationships: {
        Row: {
          created_at: string
          id: string
          parent_id: string
          relationship_type: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          parent_id: string
          relationship_type?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          parent_id?: string
          relationship_type?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      plagiarism_reports: {
        Row: {
          analyzed_at: string | null
          analyzer_version: string | null
          detailed_results: Json
          id: string
          overall_score: number
          sources_found: Json | null
          submission_id: string
        }
        Insert: {
          analyzed_at?: string | null
          analyzer_version?: string | null
          detailed_results?: Json
          id?: string
          overall_score: number
          sources_found?: Json | null
          submission_id: string
        }
        Update: {
          analyzed_at?: string | null
          analyzer_version?: string | null
          detailed_results?: Json
          id?: string
          overall_score?: number
          sources_found?: Json | null
          submission_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          accessibility_preferences: Json | null
          accommodations_needed: Json | null
          address: Json | null
          assistive_technology: Json | null
          communication_preferences: Json | null
          created_at: string
          date_of_birth: string | null
          disabilities: string[] | null
          disability_details: Json | null
          emergency_contacts: Json | null
          enrollment_date: string | null
          first_name: string
          gender: string | null
          grade_level: string | null
          guardian_email: string | null
          guardian_name: string | null
          guardian_phone: string | null
          id: string
          iep_document_path: string | null
          iep_status: boolean | null
          is_active: boolean | null
          last_name: string
          learning_preferences: Json | null
          medical_information: Json | null
          notes: string | null
          parent_email: string | null
          phone_number: string | null
          role: string
          school_name: string | null
          support_services: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accessibility_preferences?: Json | null
          accommodations_needed?: Json | null
          address?: Json | null
          assistive_technology?: Json | null
          communication_preferences?: Json | null
          created_at?: string
          date_of_birth?: string | null
          disabilities?: string[] | null
          disability_details?: Json | null
          emergency_contacts?: Json | null
          enrollment_date?: string | null
          first_name: string
          gender?: string | null
          grade_level?: string | null
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          iep_document_path?: string | null
          iep_status?: boolean | null
          is_active?: boolean | null
          last_name: string
          learning_preferences?: Json | null
          medical_information?: Json | null
          notes?: string | null
          parent_email?: string | null
          phone_number?: string | null
          role: string
          school_name?: string | null
          support_services?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accessibility_preferences?: Json | null
          accommodations_needed?: Json | null
          address?: Json | null
          assistive_technology?: Json | null
          communication_preferences?: Json | null
          created_at?: string
          date_of_birth?: string | null
          disabilities?: string[] | null
          disability_details?: Json | null
          emergency_contacts?: Json | null
          enrollment_date?: string | null
          first_name?: string
          gender?: string | null
          grade_level?: string | null
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          iep_document_path?: string | null
          iep_status?: boolean | null
          is_active?: boolean | null
          last_name?: string
          learning_preferences?: Json | null
          medical_information?: Json | null
          notes?: string | null
          parent_email?: string | null
          phone_number?: string | null
          role?: string
          school_name?: string | null
          support_services?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_analytics: {
        Row: {
          attempt_number: number | null
          correct_answer: string
          id: string
          is_correct: boolean
          question_id: string
          quiz_id: string
          recorded_at: string | null
          selected_answer: string | null
          student_id: string | null
          time_spent_seconds: number | null
        }
        Insert: {
          attempt_number?: number | null
          correct_answer: string
          id?: string
          is_correct?: boolean
          question_id: string
          quiz_id: string
          recorded_at?: string | null
          selected_answer?: string | null
          student_id?: string | null
          time_spent_seconds?: number | null
        }
        Update: {
          attempt_number?: number | null
          correct_answer?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          quiz_id?: string
          recorded_at?: string | null
          selected_answer?: string | null
          student_id?: string | null
          time_spent_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_analytics_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_analytics_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          accessibility_settings: Json | null
          answers: Json
          attempt_number: number | null
          auto_submitted: boolean | null
          completed_at: string | null
          created_at: string
          feedback_viewed: boolean | null
          id: string
          keyboard_navigation_used: boolean | null
          quiz_id: string
          score: number | null
          screen_reader_used: boolean | null
          student_id: string
          time_limit_minutes: number | null
          time_started: string | null
        }
        Insert: {
          accessibility_settings?: Json | null
          answers?: Json
          attempt_number?: number | null
          auto_submitted?: boolean | null
          completed_at?: string | null
          created_at?: string
          feedback_viewed?: boolean | null
          id?: string
          keyboard_navigation_used?: boolean | null
          quiz_id: string
          score?: number | null
          screen_reader_used?: boolean | null
          student_id: string
          time_limit_minutes?: number | null
          time_started?: string | null
        }
        Update: {
          accessibility_settings?: Json | null
          answers?: Json
          attempt_number?: number | null
          auto_submitted?: boolean | null
          completed_at?: string | null
          created_at?: string
          feedback_viewed?: boolean | null
          id?: string
          keyboard_navigation_used?: boolean | null
          quiz_id?: string
          score?: number | null
          screen_reader_used?: boolean | null
          student_id?: string
          time_limit_minutes?: number | null
          time_started?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_feedback: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          improvement_suggestions: Json | null
          overall_feedback: string | null
          question_feedback: Json | null
          quiz_attempt_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          improvement_suggestions?: Json | null
          overall_feedback?: string | null
          question_feedback?: Json | null
          quiz_attempt_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          improvement_suggestions?: Json | null
          overall_feedback?: string | null
          question_feedback?: Json | null
          quiz_attempt_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_feedback_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_feedback_quiz_attempt_id_fkey"
            columns: ["quiz_attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          allow_review: boolean | null
          availability_end: string | null
          availability_start: string | null
          created_at: string
          description: string | null
          id: string
          instructions: string | null
          is_active: boolean | null
          lesson_id: string | null
          max_attempts: number | null
          max_score: number | null
          passing_score: number | null
          questions: Json
          quiz_type: string | null
          randomize_answers: boolean | null
          randomize_questions: boolean | null
          show_correct_answers: boolean | null
          subject_id: string
          time_limit: number | null
          title: string
          updated_at: string
        }
        Insert: {
          allow_review?: boolean | null
          availability_end?: string | null
          availability_start?: string | null
          created_at?: string
          description?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          lesson_id?: string | null
          max_attempts?: number | null
          max_score?: number | null
          passing_score?: number | null
          questions?: Json
          quiz_type?: string | null
          randomize_answers?: boolean | null
          randomize_questions?: boolean | null
          show_correct_answers?: boolean | null
          subject_id: string
          time_limit?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          allow_review?: boolean | null
          availability_end?: string | null
          availability_start?: string | null
          created_at?: string
          description?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          lesson_id?: string | null
          max_attempts?: number | null
          max_score?: number | null
          passing_score?: number | null
          questions?: Json
          quiz_type?: string | null
          randomize_answers?: boolean | null
          randomize_questions?: boolean | null
          show_correct_answers?: boolean | null
          subject_id?: string
          time_limit?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          created_at: string
          id: string
          name: string
          principal_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          principal_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          principal_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schools_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_accommodations: {
        Row: {
          accommodation_type: Database["public"]["Enums"]["accommodation_type"]
          assigned_by: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          start_date: string | null
          student_id: string | null
          updated_at: string | null
        }
        Insert: {
          accommodation_type: Database["public"]["Enums"]["accommodation_type"]
          assigned_by?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          start_date?: string | null
          student_id?: string | null
          updated_at?: string | null
        }
        Update: {
          accommodation_type?: Database["public"]["Enums"]["accommodation_type"]
          assigned_by?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          start_date?: string | null
          student_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_accommodations_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_accommodations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_enrollments: {
        Row: {
          class_id: string
          created_at: string
          enrolled_at: string
          id: string
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          enrolled_at?: string
          id?: string
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          enrolled_at?: string
          id?: string
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_progress_tracking: {
        Row: {
          created_at: string | null
          current_status: string | null
          goal_description: string
          id: string
          is_achieved: boolean | null
          last_updated: string | null
          notes: string | null
          progress_percentage: number | null
          student_id: string | null
          target_date: string | null
          tracked_by: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_status?: string | null
          goal_description: string
          id?: string
          is_achieved?: boolean | null
          last_updated?: string | null
          notes?: string | null
          progress_percentage?: number | null
          student_id?: string | null
          target_date?: string | null
          tracked_by?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_status?: string | null
          goal_description?: string
          id?: string
          is_achieved?: boolean | null
          last_updated?: string | null
          notes?: string | null
          progress_percentage?: number | null
          student_id?: string | null
          target_date?: string | null
          tracked_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_progress_tracking_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_tracking_tracked_by_fkey"
            columns: ["tracked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_quiz_sessions: {
        Row: {
          accessibility_settings: Json | null
          attempt_number: number
          auto_submitted: boolean | null
          completed_at: string | null
          created_at: string | null
          current_question_index: number | null
          id: string
          last_activity: string | null
          quiz_id: string
          session_data: Json | null
          started_at: string | null
          student_id: string
          time_remaining_seconds: number | null
        }
        Insert: {
          accessibility_settings?: Json | null
          attempt_number?: number
          auto_submitted?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          current_question_index?: number | null
          id?: string
          last_activity?: string | null
          quiz_id: string
          session_data?: Json | null
          started_at?: string | null
          student_id: string
          time_remaining_seconds?: number | null
        }
        Update: {
          accessibility_settings?: Json | null
          attempt_number?: number
          auto_submitted?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          current_question_index?: number | null
          id?: string
          last_activity?: string | null
          quiz_id?: string
          session_data?: Json | null
          started_at?: string | null
          student_id?: string
          time_remaining_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_quiz_sessions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_quiz_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_support_services: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          end_date: string | null
          frequency: string | null
          id: string
          is_active: boolean | null
          location: string | null
          notes: string | null
          provider_name: string | null
          service_type: Database["public"]["Enums"]["support_service_type"]
          start_date: string | null
          student_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          notes?: string | null
          provider_name?: string | null
          service_type: Database["public"]["Enums"]["support_service_type"]
          start_date?: string | null
          student_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          notes?: string | null
          provider_name?: string | null
          service_type?: Database["public"]["Enums"]["support_service_type"]
          start_date?: string | null
          student_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_support_services_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subject_enrollment_requests: {
        Row: {
          created_at: string
          id: string
          invitation_code: string
          processed_at: string | null
          processed_by: string | null
          requested_at: string
          status: string
          student_id: string
          subject_id: string
          teacher_feedback: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          invitation_code: string
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string
          status?: string
          student_id: string
          subject_id: string
          teacher_feedback?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          invitation_code?: string
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string
          status?: string
          student_id?: string
          subject_id?: string
          teacher_feedback?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subject_enrollment_requests_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subject_enrollment_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subject_enrollment_requests_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subject_invitation_codes: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          invitation_code: string
          is_active: boolean
          subject_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          invitation_code: string
          is_active?: boolean
          subject_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          invitation_code?: string
          is_active?: boolean
          subject_id?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          class_id: string
          created_at: string
          description: string | null
          id: string
          invitation_code: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          description?: string | null
          id?: string
          invitation_code?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          description?: string | null
          id?: string
          invitation_code?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_feedback: {
        Row: {
          comment_text: string
          commenter_id: string
          created_at: string | null
          feedback_type: string | null
          id: string
          is_resolved: boolean | null
          line_number: number | null
          submission_id: string
          timestamp_seconds: number | null
          updated_at: string | null
        }
        Insert: {
          comment_text: string
          commenter_id: string
          created_at?: string | null
          feedback_type?: string | null
          id?: string
          is_resolved?: boolean | null
          line_number?: number | null
          submission_id: string
          timestamp_seconds?: number | null
          updated_at?: string | null
        }
        Update: {
          comment_text?: string
          commenter_id?: string
          created_at?: string | null
          feedback_type?: string | null
          id?: string
          is_resolved?: boolean | null
          line_number?: number | null
          submission_id?: string
          timestamp_seconds?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      video_likes: {
        Row: {
          created_at: string
          id: string
          liked: boolean
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          liked?: boolean
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          liked?: boolean
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_likes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      video_materials: {
        Row: {
          audio_description_path: string | null
          captions_path: string | null
          category: string | null
          created_at: string
          description: string | null
          difficulty_level: string | null
          duration: number | null
          external_url: string | null
          file_path: string
          file_size: number | null
          id: string
          lesson_id: string | null
          resolution: string | null
          school_id: string | null
          sign_language_video_path: string | null
          subject_id: string | null
          tags: string[] | null
          thumbnail_path: string | null
          title: string
          transcript_text: string | null
          updated_at: string
          uploaded_by: string
          video_format: string | null
          visibility: string
        }
        Insert: {
          audio_description_path?: string | null
          captions_path?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          duration?: number | null
          external_url?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          lesson_id?: string | null
          resolution?: string | null
          school_id?: string | null
          sign_language_video_path?: string | null
          subject_id?: string | null
          tags?: string[] | null
          thumbnail_path?: string | null
          title: string
          transcript_text?: string | null
          updated_at?: string
          uploaded_by: string
          video_format?: string | null
          visibility?: string
        }
        Update: {
          audio_description_path?: string | null
          captions_path?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          duration?: number | null
          external_url?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          lesson_id?: string | null
          resolution?: string | null
          school_id?: string | null
          sign_language_video_path?: string | null
          subject_id?: string | null
          tags?: string[] | null
          thumbnail_path?: string | null
          title?: string
          transcript_text?: string | null
          updated_at?: string
          uploaded_by?: string
          video_format?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_materials_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_materials_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_materials_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_materials_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      video_views: {
        Row: {
          completed: boolean
          created_at: string
          device: string | null
          ended_at: string | null
          id: string
          session_id: string | null
          source: string | null
          started_at: string
          updated_at: string
          user_id: string | null
          video_id: string
          watch_seconds: number
        }
        Insert: {
          completed?: boolean
          created_at?: string
          device?: string | null
          ended_at?: string | null
          id?: string
          session_id?: string | null
          source?: string | null
          started_at?: string
          updated_at?: string
          user_id?: string | null
          video_id: string
          watch_seconds?: number
        }
        Update: {
          completed?: boolean
          created_at?: string
          device?: string | null
          ended_at?: string | null
          id?: string
          session_id?: string | null
          source?: string | null
          started_at?: string
          updated_at?: string
          user_id?: string | null
          video_id?: string
          watch_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "video_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_views_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_materials"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_demo_user: {
        Args: {
          user_email: string
          user_first_name: string
          user_last_name: string
          user_password: string
          user_role: string
          user_school_name?: string
        }
        Returns: string
      }
      generate_code: {
        Args: { code_len?: number }
        Returns: string
      }
      generate_unique_code: {
        Args: { code_len?: number; target_column: string; target_table: string }
        Returns: string
      }
      generate_unique_invitation_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_profile_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_parent_student_ids_for_user: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      get_student_assignments: {
        Args: { student_profile_id: string }
        Returns: {
          created_at: string
          description: string
          due_date: string
          id: string
          is_active: boolean
          max_score: number
          subject: Json
          subject_id: string
          submissions: Json
          title: string
          updated_at: string
        }[]
      }
      get_user_profile_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      global_search: {
        Args: { limit_count?: number; q: string }
        Returns: {
          entity_type: string
          id: string
          rank: number
          route: string
          subtitle: string
          title: string
        }[]
      }
      is_class_taught_by_current_teacher: {
        Args: { p_class_id: string }
        Returns: boolean
      }
      is_current_student_enrolled_in_class: {
        Args: { p_class_id: string }
        Returns: boolean
      }
      is_principal: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_teacher_of_student: {
        Args: { student_profile_id: string }
        Returns: boolean
      }
      is_user_in_school: {
        Args: { target_school_id: string }
        Returns: boolean
      }
      regen_subject_invitation_code: {
        Args: { subject_id: string }
        Returns: string
      }
      request_subject_enrollment: {
        Args: { invitation_code: string }
        Returns: string
      }
      restore_deleted_item: {
        Args: { deleted_item_id: string }
        Returns: boolean
      }
      soft_delete_item: {
        Args: { deleter_id: string; item_id: string; table_name: string }
        Returns: boolean
      }
    }
    Enums: {
      accommodation_type:
        | "extended_time"
        | "reduced_distractions"
        | "large_print"
        | "screen_reader"
        | "sign_language_interpreter"
        | "note_taker"
        | "alternative_format"
        | "assistive_technology"
        | "frequent_breaks"
        | "preferential_seating"
        | "modified_assignments"
        | "oral_testing"
        | "calculator_allowed"
        | "spell_check_allowed"
        | "other"
      assignment_type:
        | "essay"
        | "quiz"
        | "file_upload"
        | "code_submission"
        | "group_project"
        | "presentation"
        | "portfolio"
        | "peer_review"
      disability_type:
        | "visual_impairment"
        | "hearing_impairment"
        | "physical_disability"
        | "cognitive_disability"
        | "learning_disability"
        | "autism_spectrum"
        | "adhd"
        | "speech_language_disorder"
        | "emotional_behavioral_disorder"
        | "multiple_disabilities"
        | "traumatic_brain_injury"
        | "other"
      rubric_criteria_type:
        | "excellent"
        | "good"
        | "satisfactory"
        | "needs_improvement"
        | "unsatisfactory"
      submission_status:
        | "draft"
        | "submitted"
        | "late"
        | "graded"
        | "returned"
        | "resubmitted"
      support_service_type:
        | "speech_therapy"
        | "occupational_therapy"
        | "physical_therapy"
        | "counseling"
        | "tutoring"
        | "behavioral_support"
        | "mobility_assistance"
        | "communication_assistance"
        | "academic_coaching"
        | "social_skills_training"
        | "transition_services"
        | "other"
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
      accommodation_type: [
        "extended_time",
        "reduced_distractions",
        "large_print",
        "screen_reader",
        "sign_language_interpreter",
        "note_taker",
        "alternative_format",
        "assistive_technology",
        "frequent_breaks",
        "preferential_seating",
        "modified_assignments",
        "oral_testing",
        "calculator_allowed",
        "spell_check_allowed",
        "other",
      ],
      assignment_type: [
        "essay",
        "quiz",
        "file_upload",
        "code_submission",
        "group_project",
        "presentation",
        "portfolio",
        "peer_review",
      ],
      disability_type: [
        "visual_impairment",
        "hearing_impairment",
        "physical_disability",
        "cognitive_disability",
        "learning_disability",
        "autism_spectrum",
        "adhd",
        "speech_language_disorder",
        "emotional_behavioral_disorder",
        "multiple_disabilities",
        "traumatic_brain_injury",
        "other",
      ],
      rubric_criteria_type: [
        "excellent",
        "good",
        "satisfactory",
        "needs_improvement",
        "unsatisfactory",
      ],
      submission_status: [
        "draft",
        "submitted",
        "late",
        "graded",
        "returned",
        "resubmitted",
      ],
      support_service_type: [
        "speech_therapy",
        "occupational_therapy",
        "physical_therapy",
        "counseling",
        "tutoring",
        "behavioral_support",
        "mobility_assistance",
        "communication_assistance",
        "academic_coaching",
        "social_skills_training",
        "transition_services",
        "other",
      ],
    },
  },
} as const
