import { create } from "zustand";
import { devtools } from "zustand/middleware";

// Types
export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  matric_number: string;
  address?: string;
  state_of_origin: string;
  faculty?: string;
  department?: string;
  level?: string;
  block?: string;
  room?: string;
  bedspace_label?: string;
  date_of_birth?: string;
  lga?: string;
  marital_status?: string;
  religion?: string;
  course?: string;
  next_of_kin_name?: string;
  next_of_kin_phone?: string;
  next_of_kin_email?: string;
  next_of_kin_relationship?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  email: string;
  phone: string;
  amount_paid: number;
  invoice_id: string;
  status: "pending" | "completed" | "failed" | "partially_paid";
  paid_at?: string;
  created_at: string;
  updated_at: string;
  student?: Student;
}

export interface Room {
  id: string;
  name: string;
  block: string;
  total_beds: number;
  available_beds: string[];
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "admin" | "super_admin";
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface LoadingState {
  students: boolean;
  payments: boolean;
  rooms: boolean;
  adminUsers: boolean;
  dashboard: boolean;
}

export interface AppState {
  // Data
  students: Student[];
  payments: Payment[];
  rooms: Room[];
  adminUsers: AdminUser[];
  currentUser: AdminUser | null;

  // Loading states
  loading: LoadingState;

  // UI State
  sidebarCollapsed: boolean;
  lastDataFetch: number;

  // Actions
  setStudents: (students: Student[]) => void;
  setPayments: (payments: Payment[]) => void;
  setRooms: (rooms: Room[]) => void;
  setAdminUsers: (adminUsers: AdminUser[]) => void;
  setCurrentUser: (user: AdminUser | null) => void;
  setLoading: (key: keyof LoadingState, loading: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setLastDataFetch: (timestamp: number) => void;

  // Batch actions
  setAllData: (data: {
    students: Student[];
    payments: Payment[];
    rooms: Room[];
    adminUsers: AdminUser[];
  }) => void;

  // Utility actions
  addStudent: (student: Student) => void;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  removeStudent: (id: string) => void;

  addPayment: (payment: Payment) => void;
  updatePayment: (id: string, updates: Partial<Payment>) => void;
  removePayment: (id: string) => void;

  addRoom: (room: Room) => void;
  updateRoom: (id: string, updates: Partial<Room>) => void;
  removeRoom: (id: string) => void;

  addAdminUser: (adminUser: AdminUser) => void;
  updateAdminUser: (id: string, updates: Partial<AdminUser>) => void;
  removeAdminUser: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // Initial state
      students: [],
      payments: [],
      rooms: [],
      adminUsers: [],
      currentUser: null,

      loading: {
        students: false,
        payments: false,
        rooms: false,
        adminUsers: false,
        dashboard: false,
      },

      sidebarCollapsed: true, // Start closed on mobile
      lastDataFetch: 0,

      // Actions
      setStudents: (students) => set({ students }),
      setPayments: (payments) => set({ payments }),
      setRooms: (rooms) => set({ rooms }),
      setAdminUsers: (adminUsers) => set({ adminUsers }),
      setCurrentUser: (currentUser) => set({ currentUser }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setLastDataFetch: (lastDataFetch) => set({ lastDataFetch }),

      setLoading: (key, loading) =>
        set((state) => ({
          loading: { ...state.loading, [key]: loading },
        })),

      setAllData: (data) =>
        set({
          students: data.students,
          payments: data.payments,
          rooms: data.rooms,
          adminUsers: data.adminUsers,
          lastDataFetch: Date.now(),
        }),

      // Student actions
      addStudent: (student) =>
        set((state) => ({
          students: [student, ...state.students],
        })),

      updateStudent: (id, updates) =>
        set((state) => ({
          students: state.students.map((student) =>
            student.id === id ? { ...student, ...updates } : student
          ),
        })),

      removeStudent: (id) =>
        set((state) => ({
          students: state.students.filter((student) => student.id !== id),
        })),

      // Payment actions
      addPayment: (payment) =>
        set((state) => ({
          payments: [payment, ...state.payments],
        })),

      updatePayment: (id, updates) =>
        set((state) => ({
          payments: state.payments.map((payment) =>
            payment.id === id ? { ...payment, ...updates } : payment
          ),
        })),

      removePayment: (id) =>
        set((state) => ({
          payments: state.payments.filter((payment) => payment.id !== id),
        })),

      // Room actions
      addRoom: (room) =>
        set((state) => ({
          rooms: [room, ...state.rooms],
        })),

      updateRoom: (id, updates) =>
        set((state) => ({
          rooms: state.rooms.map((room) =>
            room.id === id ? { ...room, ...updates } : room
          ),
        })),

      removeRoom: (id) =>
        set((state) => ({
          rooms: state.rooms.filter((room) => room.id !== id),
        })),

      // Admin user actions
      addAdminUser: (adminUser) =>
        set((state) => ({
          adminUsers: [adminUser, ...state.adminUsers],
        })),

      updateAdminUser: (id, updates) =>
        set((state) => ({
          adminUsers: state.adminUsers.map((adminUser) =>
            adminUser.id === id ? { ...adminUser, ...updates } : adminUser
          ),
        })),

      removeAdminUser: (id) =>
        set((state) => ({
          adminUsers: state.adminUsers.filter(
            (adminUser) => adminUser.id !== id
          ),
        })),
    }),
    {
      name: "app-store",
    }
  )
);
