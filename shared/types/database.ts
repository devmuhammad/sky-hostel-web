export interface Database {
  public: {
    Tables: {
      payments: {
        Row: {
          id: string;
          email: string;
          phone: string;
          amount_paid: number;
          invoice_id: string;
          status: "pending" | "completed" | "failed";
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          phone: string;
          amount_paid: number;
          invoice_id: string;
          status?: "pending" | "completed" | "failed";
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          phone?: string;
          amount_paid?: number;
          invoice_id?: string;
          status?: "pending" | "completed" | "failed";
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
          user_id: string | null;
          metadata: Record<string, any> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          action: string;
          resource_type: string;
          resource_id: string;
          user_id?: string | null;
          metadata?: Record<string, any> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          action?: string;
          resource_type?: string;
          resource_id?: string;
          user_id?: string | null;
          metadata?: Record<string, any> | null;
          created_at?: string;
        };
      };
    };
  };
}
