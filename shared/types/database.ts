export interface Database {
  public: {
    Tables: {
      payments: {
        Row: {
          id: string;
          email: string;
          phone: string;
          amount_to_pay: number;
          amount_paid: number;
          invoice_id: string;
          status: "pending" | "completed" | "failed" | "partially_paid";
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          phone: string;
          amount_to_pay: number;
          amount_paid?: number;
          invoice_id: string;
          status?: "pending" | "completed" | "failed" | "partially_paid";
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          phone?: string;
          amount_to_pay?: number;
          amount_paid?: number;
          invoice_id?: string;
          status?: "pending" | "completed" | "failed" | "partially_paid";
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      students: {
        Row: {
          id: string;
          // Personal Information
          first_name: string;
          last_name: string;
          email: string;
          phone: string;
          date_of_birth: string;
          address: string;
          state_of_origin: string;
          lga: string;
          marital_status: string;
          religion: string;
          // Academic Information
          matric_number: string;
          course: string;
          level: string;
          faculty: string;
          department: string;
          // Next of Kin Information
          next_of_kin_name: string;
          next_of_kin_phone: string;
          next_of_kin_email: string;
          next_of_kin_relationship: string;
          // Accommodation Information
          block: string;
          room: string;
          bedspace_label: string;
          // File Storage
          passport_photo_url: string | null;
          // System Information
          payment_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          // Personal Information
          first_name: string;
          last_name: string;
          email: string;
          phone: string;
          date_of_birth: string;
          address: string;
          state_of_origin: string;
          lga: string;
          marital_status: string;
          religion: string;
          // Academic Information
          matric_number: string;
          course: string;
          level: string;
          faculty: string;
          department: string;
          // Next of Kin Information
          next_of_kin_name: string;
          next_of_kin_phone: string;
          next_of_kin_email: string;
          next_of_kin_relationship: string;
          // Accommodation Information
          block: string;
          room: string;
          bedspace_label: string;
          // File Storage
          passport_photo_url?: string | null;
          // System Information
          payment_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          // Personal Information
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string;
          date_of_birth?: string;
          address?: string;
          state_of_origin?: string;
          lga?: string;
          marital_status?: string;
          religion?: string;
          // Academic Information
          matric_number?: string;
          course?: string;
          level?: string;
          faculty?: string;
          department?: string;
          // Next of Kin Information
          next_of_kin_name?: string;
          next_of_kin_phone?: string;
          next_of_kin_email?: string;
          next_of_kin_relationship?: string;
          // Accommodation Information
          block?: string;
          room?: string;
          bedspace_label?: string;
          // File Storage
          passport_photo_url?: string | null;
          // System Information
          payment_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      rooms: {
        Row: {
          id: string;
          name: string;
          block: string;
          total_beds: number;
          bed_type: "4_bed" | "6_bed";
          available_beds: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          block: string;
          total_beds: number;
          bed_type: "4_bed" | "6_bed";
          available_beds: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          block?: string;
          total_beds?: number;
          bed_type?: "4_bed" | "6_bed";
          available_beds?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      activity_logs: {
        Row: {
          id: string;
          action: string;
          resource_type: string;
          resource_id: string;
          admin_user_id: string | null;
          metadata: Record<string, any> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          action: string;
          resource_type: string;
          resource_id: string;
          admin_user_id?: string | null;
          metadata?: Record<string, any> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          action?: string;
          resource_type?: string;
          resource_id?: string;
          admin_user_id?: string | null;
          metadata?: Record<string, any> | null;
          created_at?: string;
        };
      };
      student_reports: {
        Row: {
          id: string;
          student_id: string;
          reporter_id: string;
          category: "warning" | "misconduct" | "damage" | "late_payment" | "disturbance" | "commendation";
          severity: "low" | "medium" | "high";
          title: string;
          comments: string | null;
          evidence_url: string | null;
          status: "resolved" | "unresolved" | "under_review";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          reporter_id: string;
          category: "warning" | "misconduct" | "damage" | "late_payment" | "disturbance" | "commendation";
          severity: "low" | "medium" | "high";
          title: string;
          comments?: string | null;
          evidence_url?: string | null;
          status?: "resolved" | "unresolved" | "under_review";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          reporter_id?: string;
          category?: "warning" | "misconduct" | "damage" | "late_payment" | "disturbance" | "commendation";
          severity?: "low" | "medium" | "high";
          title?: string;
          comments?: string | null;
          evidence_url?: string | null;
          status?: "resolved" | "unresolved" | "under_review";
          created_at?: string;
          updated_at?: string;
        };
      };
      inventory_items: {
        Row: {
          id: string;
          name: string;
          category: string;
          category_id: string | null;
          room_id: string | null;
          condition: "good" | "needs_repair" | "spoilt" | "destroyed";
          assigned_to: string | null;
          price_estimate: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
          category_id?: string | null;
          room_id?: string | null;
          condition?: "good" | "needs_repair" | "spoilt" | "destroyed";
          assigned_to?: string | null;
          price_estimate?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          category_id?: string | null;
          room_id?: string | null;
          condition?: "good" | "needs_repair" | "spoilt" | "destroyed";
          assigned_to?: string | null;
          price_estimate?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      inventory_damage_reports: {
        Row: {
          id: string;
          item_id: string;
          reporter_id: string;
          description: string;
          cost_estimate: number | null;
          image_url: string | null;
          responsible_student_id: string | null;
          status: string;
          action_taken: string | null;
          handled_by: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          item_id: string;
          reporter_id: string;
          description: string;
          cost_estimate?: number | null;
          image_url?: string | null;
          responsible_student_id?: string | null;
          status?: string;
          action_taken?: string | null;
          handled_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          item_id?: string;
          reporter_id?: string;
          description?: string;
          cost_estimate?: number | null;
          image_url?: string | null;
          responsible_student_id?: string | null;
          status?: string;
          action_taken?: string | null;
          handled_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      staff_daily_logs: {
        Row: {
          id: string;
          staff_id: string;
          log_date: string;
          shift: "morning" | "afternoon" | "night";
          duty_type: string;
          activities: string;
          issues_observed: string | null;
          materials_used: string | null;
          supervisor_status: "pending" | "approved" | "requires_clarification";
          supervisor_comments: string | null;
          supervisor_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          log_date?: string;
          shift: "morning" | "afternoon" | "night";
          duty_type: string;
          activities: string;
          issues_observed?: string | null;
          materials_used?: string | null;
          supervisor_status?: "pending" | "approved" | "requires_clarification";
          supervisor_comments?: string | null;
          supervisor_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          staff_id?: string;
          log_date?: string;
          shift?: "morning" | "afternoon" | "night";
          duty_type?: string;
          activities?: string;
          issues_observed?: string | null;
          materials_used?: string | null;
          supervisor_status?: "pending" | "approved" | "requires_clarification";
          supervisor_comments?: string | null;
          supervisor_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      staff_leave_requests: {
        Row: {
          id: string;
          staff_id: string;
          start_date: string;
          end_date: string;
          reason: string;
          status: "pending" | "approved" | "rejected";
          approved_by: string | null;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          start_date: string;
          end_date: string;
          reason: string;
          status?: "pending" | "approved" | "rejected";
          approved_by?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          staff_id?: string;
          start_date?: string;
          end_date?: string;
          reason?: string;
          status?: "pending" | "approved" | "rejected";
          approved_by?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
