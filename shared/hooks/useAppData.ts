"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/shared/store/appStore";
import { createClientSupabaseClient } from "@/shared/config/auth";
import { useToast } from "./useToast";
import React from "react"; // Added missing import for React

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
  const { setStudents, setLoading } = useAppStore();
  const toast = useToast();

  return useQuery({
    queryKey: ["students"],
    queryFn: fetchStudents,
    onSuccess: (data) => {
      setStudents(data);
      setLoading("students", false);
    },
    onError: (error) => {
      console.error("Error fetching students:", error);
      toast.error("Failed to fetch students");
      setLoading("students", false);
    },
    onSettled: () => {
      setLoading("students", false);
    },
  });
};

export const usePayments = () => {
  const { setPayments, setLoading } = useAppStore();
  const toast = useToast();

  return useQuery({
    queryKey: ["payments"],
    queryFn: fetchPayments,
    onSuccess: (data) => {
      setPayments(data);
      setLoading("payments", false);
    },
    onError: (error) => {
      console.error("Error fetching payments:", error);
      toast.error("Failed to fetch payments");
      setLoading("payments", false);
    },
    onSettled: () => {
      setLoading("payments", false);
    },
  });
};

export const useRooms = () => {
  const { setRooms, setLoading } = useAppStore();
  const toast = useToast();

  return useQuery({
    queryKey: ["rooms"],
    queryFn: fetchRooms,
    onSuccess: (data) => {
      setRooms(data);
      setLoading("rooms", false);
    },
    onError: (error) => {
      console.error("Error fetching rooms:", error);
      toast.error("Failed to fetch rooms");
      setLoading("rooms", false);
    },
    onSettled: () => {
      setLoading("rooms", false);
    },
  });
};

export const useAdminUsers = () => {
  const { setAdminUsers, setLoading } = useAppStore();
  const toast = useToast();

  return useQuery({
    queryKey: ["adminUsers"],
    queryFn: fetchAdminUsers,
    onSuccess: (data) => {
      setAdminUsers(data);
      setLoading("adminUsers", false);
    },
    onError: (error) => {
      console.error("Error fetching admin users:", error);
      toast.error("Failed to fetch admin users");
      setLoading("adminUsers", false);
    },
    onSettled: () => {
      setLoading("adminUsers", false);
    },
  });
};

// Mutation Hooks
export const useCreateStudent = () => {
  const queryClient = useQueryClient();
  const { addStudent } = useAppStore();
  const toast = useToast();

  return useMutation({
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
    onMutate: async (newStudent) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["students"] });

      // Snapshot the previous value
      const previousStudents = queryClient.getQueryData(["students"]);

      // Optimistically update to the new value
      queryClient.setQueryData(["students"], (old: any) => [
        { ...newStudent, id: "temp-" + Date.now() },
        ...(old || []),
      ]);

      // Return a context object with the snapshotted value
      return { previousStudents };
    },
    onError: (err, newStudent, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(["students"], context?.previousStudents);
      toast.error("Failed to create student");
    },
    onSuccess: (data) => {
      // Update the store
      addStudent(data);
      toast.success("Student created successfully");
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
};

export const useUpdateStudent = () => {
  const queryClient = useQueryClient();
  const { updateStudent } = useAppStore();
  const toast = useToast();

  return useMutation({
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
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ["students"] });
      const previousStudents = queryClient.getQueryData(["students"]);

      queryClient.setQueryData(["students"], (old: any) =>
        old?.map((student: any) =>
          student.id === id ? { ...student, ...updates } : student
        )
      );

      return { previousStudents };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(["students"], context?.previousStudents);
      toast.error("Failed to update student");
    },
    onSuccess: (data) => {
      updateStudent(data.id, data);
      toast.success("Student updated successfully");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  const { addPayment } = useAppStore();
  const toast = useToast();

  return useMutation({
    mutationFn: async (paymentData: any) => {
      const supabase = createClientSupabaseClient();
      const { data, error } = await supabase
        .from("payments")
        .insert(paymentData)
        .select(
          `
          *,
          student:students(*)
        `
        )
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (newPayment) => {
      await queryClient.cancelQueries({ queryKey: ["payments"] });
      const previousPayments = queryClient.getQueryData(["payments"]);

      queryClient.setQueryData(["payments"], (old: any) => [
        { ...newPayment, id: "temp-" + Date.now() },
        ...(old || []),
      ]);

      return { previousPayments };
    },
    onError: (err, newPayment, context) => {
      queryClient.setQueryData(["payments"], context?.previousPayments);
      toast.error("Failed to create payment");
    },
    onSuccess: (data) => {
      addPayment(data);
      toast.success("Payment created successfully");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
};

export const useUpdatePayment = () => {
  const queryClient = useQueryClient();
  const { updatePayment } = useAppStore();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const supabase = createClientSupabaseClient();
      const { data, error } = await supabase
        .from("payments")
        .update(updates)
        .eq("id", id)
        .select(
          `
          *,
          student:students(*)
        `
        )
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ["payments"] });
      const previousPayments = queryClient.getQueryData(["payments"]);

      queryClient.setQueryData(["payments"], (old: any) =>
        old?.map((payment: any) =>
          payment.id === id ? { ...payment, ...updates } : payment
        )
      );

      return { previousPayments };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(["payments"], context?.previousPayments);
      toast.error("Failed to update payment");
    },
    onSuccess: (data) => {
      updatePayment(data.id, data);
      toast.success("Payment updated successfully");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
};

// Combined hook for fetching all data
export const useAppData = () => {
  const { setAllData, setLoading, lastDataFetch } = useAppStore();
  const toast = useToast();

  const studentsQuery = useStudents();
  const paymentsQuery = usePayments();
  const roomsQuery = useRooms();
  const adminUsersQuery = useAdminUsers();

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

  // Handle errors
  React.useEffect(() => {
    if (isError) {
      toast.error("Failed to load some data");
    }
  }, [isError, toast]);

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

  return {
    isLoading,
    isError,
    lastDataFetch,
    refetch: () => {
      studentsQuery.refetch();
      paymentsQuery.refetch();
      roomsQuery.refetch();
      adminUsersQuery.refetch();
    },
  };
};
