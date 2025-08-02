"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/shared/store/appStore";
import { createClientSupabaseClient } from "@/shared/config/auth";
import { useToast } from "./useToast";
import React, { useEffect } from "react"; // Added missing import for React

// API Functions
const fetchStudents = async () => {
  const supabase = createClientSupabaseClient();
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

const fetchPayments = async () => {
  const supabase = createClientSupabaseClient();
  const { data, error } = await supabase
    .from("payments")
    .select(
      `
      *,
      student:students(*)
    `
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

const fetchRooms = async () => {
  const supabase = createClientSupabaseClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

const fetchAdminUsers = async () => {
  const supabase = createClientSupabaseClient();
  const { data, error } = await supabase
    .from("admin_users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

// React Query Hooks
export const useStudents = () => {
  const { setStudents, setLoading, currentUser } = useAppStore();
  const toast = useToast();

  const query = useQuery({
    queryKey: ["students"],
    queryFn: fetchStudents,
    enabled: !!currentUser, // Only fetch if there's a current user
  });

  useEffect(() => {
    if (query.data) {
      setStudents(query.data);
      setLoading("students", false);
    }
  }, [query.data, setStudents, setLoading]);

  useEffect(() => {
    if (query.error) {
      console.error("Error fetching students:", query.error);
      toast.error("Failed to fetch students");
      setLoading("students", false);
    }
  }, [query.error, toast, setLoading]);

  useEffect(() => {
    setLoading("students", query.isLoading);
  }, [query.isLoading, setLoading]);

  return query;
};

export const usePayments = () => {
  const { setPayments, setLoading, currentUser } = useAppStore();
  const toast = useToast();

  const query = useQuery({
    queryKey: ["payments"],
    queryFn: fetchPayments,
    enabled: !!currentUser, // Only fetch if there's a current user
  });

  useEffect(() => {
    if (query.data) {
      setPayments(query.data);
      setLoading("payments", false);
    }
  }, [query.data, setPayments, setLoading]);

  useEffect(() => {
    if (query.error) {
      console.error("Error fetching payments:", query.error);
      toast.error("Failed to fetch payments");
      setLoading("payments", false);
    }
  }, [query.error, toast, setLoading]);

  useEffect(() => {
    setLoading("payments", query.isLoading);
  }, [query.isLoading, setLoading]);

  return query;
};

export const useRooms = () => {
  const { setRooms, setLoading, currentUser } = useAppStore();
  const toast = useToast();

  const query = useQuery({
    queryKey: ["rooms"],
    queryFn: fetchRooms,
    enabled: !!currentUser, // Only fetch if there's a current user
  });

  useEffect(() => {
    if (query.data) {
      setRooms(query.data);
      setLoading("rooms", false);
    }
  }, [query.data, setRooms, setLoading]);

  useEffect(() => {
    if (query.error) {
      console.error("Error fetching rooms:", query.error);
      toast.error("Failed to fetch rooms");
      setLoading("rooms", false);
    }
  }, [query.error, toast, setLoading]);

  useEffect(() => {
    setLoading("rooms", query.isLoading);
  }, [query.isLoading, setLoading]);

  return query;
};

export const useAdminUsers = () => {
  const { setAdminUsers, setLoading, currentUser } = useAppStore();
  const toast = useToast();

  const query = useQuery({
    queryKey: ["adminUsers"],
    queryFn: fetchAdminUsers,
    enabled: !!currentUser, // Only fetch if there's a current user
  });

  useEffect(() => {
    if (query.data) {
      setAdminUsers(query.data);
      setLoading("adminUsers", false);
    }
  }, [query.data, setAdminUsers, setLoading]);

  useEffect(() => {
    if (query.error) {
      console.error("Error fetching admin users:", query.error);
      toast.error("Failed to fetch admin users");
      setLoading("adminUsers", false);
    }
  }, [query.error, toast, setLoading]);

  useEffect(() => {
    setLoading("adminUsers", query.isLoading);
  }, [query.isLoading, setLoading]);

  return query;
};

// Mutation Hooks
export const useCreateStudent = () => {
  const queryClient = useQueryClient();
  const { addStudent } = useAppStore();
  const toast = useToast();

  const mutation = useMutation({
    mutationFn: async (studentData: any) => {
      const supabase = createClientSupabaseClient();
      const { data, error } = await supabase
        .from("students")
        .insert(studentData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (mutation.data) {
      addStudent(mutation.data);
      toast.success("Student created successfully");
    }
  }, [mutation.data, addStudent, toast]);

  useEffect(() => {
    if (mutation.error) {
      toast.error("Failed to create student");
    }
  }, [mutation.error, toast]);

  useEffect(() => {
    if (mutation.isSuccess) {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    }
  }, [mutation.isSuccess, queryClient]);

  return mutation;
};

export const useUpdateStudent = () => {
  const queryClient = useQueryClient();
  const { updateStudent } = useAppStore();
  const toast = useToast();

  const mutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const supabase = createClientSupabaseClient();
      const { data, error } = await supabase
        .from("students")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (mutation.data) {
      updateStudent(mutation.data.id, mutation.data);
      toast.success("Student updated successfully");
    }
  }, [mutation.data, updateStudent, toast]);

  useEffect(() => {
    if (mutation.error) {
      toast.error("Failed to update student");
    }
  }, [mutation.error, toast]);

  useEffect(() => {
    if (mutation.isSuccess) {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    }
  }, [mutation.isSuccess, queryClient]);

  return mutation;
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  const { addPayment } = useAppStore();
  const toast = useToast();

  const mutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const supabase = createClientSupabaseClient();
      const { data, error } = await supabase
        .from("payments")
        .insert(paymentData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (mutation.data) {
      addPayment(mutation.data);
      toast.success("Payment created successfully");
    }
  }, [mutation.data, addPayment, toast]);

  useEffect(() => {
    if (mutation.error) {
      toast.error("Failed to create payment");
    }
  }, [mutation.error, toast]);

  useEffect(() => {
    if (mutation.isSuccess) {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    }
  }, [mutation.isSuccess, queryClient]);

  return mutation;
};

export const useUpdatePayment = () => {
  const queryClient = useQueryClient();
  const { updatePayment } = useAppStore();
  const toast = useToast();

  const mutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const supabase = createClientSupabaseClient();
      const { data, error } = await supabase
        .from("payments")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (mutation.data) {
      updatePayment(mutation.data.id, mutation.data);
      toast.success("Payment updated successfully");
    }
  }, [mutation.data, updatePayment, toast]);

  useEffect(() => {
    if (mutation.error) {
      toast.error("Failed to update payment");
    }
  }, [mutation.error, toast]);

  useEffect(() => {
    if (mutation.isSuccess) {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    }
  }, [mutation.isSuccess, queryClient]);

  return mutation;
};

// Combined hook for fetching all data
export const useAppData = () => {
  const { setAllData, setLoading, lastDataFetch, currentUser } = useAppStore();
  const toast = useToast();

  // Only fetch data if there's a current user (admin)
  const shouldFetch = !!currentUser;

  const studentsQuery = useQuery({
    queryKey: ["students"],
    queryFn: fetchStudents,
    enabled: shouldFetch,
    retry: false, // Don't retry if database is not accessible
  });

  const paymentsQuery = useQuery({
    queryKey: ["payments"],
    queryFn: fetchPayments,
    enabled: shouldFetch,
    retry: false,
  });

  const roomsQuery = useQuery({
    queryKey: ["rooms"],
    queryFn: fetchRooms,
    enabled: shouldFetch,
    retry: false,
  });

  const adminUsersQuery = useQuery({
    queryKey: ["adminUsers"],
    queryFn: fetchAdminUsers,
    enabled: shouldFetch,
    retry: false,
  });

  const isLoading =
    studentsQuery.isLoading ||
    paymentsQuery.isLoading ||
    roomsQuery.isLoading ||
    adminUsersQuery.isLoading;

  const isError =
    studentsQuery.isError ||
    paymentsQuery.isError ||
    roomsQuery.isError ||
    adminUsersQuery.isError;

  // Set loading state
  React.useEffect(() => {
    setLoading("dashboard", isLoading);
  }, [isLoading, setLoading]);

  // Handle errors silently for now since database is not accessible
  React.useEffect(() => {
    if (isError) {
      console.log(
        "Database queries failed - this is expected since database is not accessible"
      );
    }
  }, [isError]);

  // Update store when all data is loaded
  React.useEffect(() => {
    if (
      studentsQuery.data &&
      paymentsQuery.data &&
      roomsQuery.data &&
      adminUsersQuery.data
    ) {
      setAllData({
        students: studentsQuery.data,
        payments: paymentsQuery.data,
        rooms: roomsQuery.data,
        adminUsers: adminUsersQuery.data,
      });
    }
  }, [
    studentsQuery.data,
    paymentsQuery.data,
    roomsQuery.data,
    adminUsersQuery.data,
    setAllData,
  ]);

  // Memoize the refetch function to prevent infinite loops
  const refetch = React.useCallback(() => {
    studentsQuery.refetch();
    paymentsQuery.refetch();
    roomsQuery.refetch();
    adminUsersQuery.refetch();
  }, [studentsQuery, paymentsQuery, roomsQuery, adminUsersQuery]);

  return {
    isLoading,
    isError,
    lastDataFetch,
    refetch,
  };
};
