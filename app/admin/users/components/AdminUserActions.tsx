"use client";

import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Modal } from "@/shared/components/ui/modal";
import { toast } from "sonner";
import { Label } from "@/shared/components/ui/label";
import { LoadingButton } from "@/shared/components/ui/loading-button";

export default function AdminUserActions({ user }: { user: any }) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState(user.role);

  const handleUpdateRole = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Role updated successfully");
        setIsEditModalOpen(false);
        window.location.reload();
      } else {
        toast.error(data.error || "Failed to update role");
      }
    } catch (e) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!confirm(`Are you sure you want to ${user.is_active ? "suspend" : "activate"} this user?`)) return;
    
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !user.is_active }),
      });
      if (res.ok) {
        toast.success(`User ${user.is_active ? "suspended" : "activated"} successfully`);
        window.location.reload();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update status");
      }
    } catch (e) {
      toast.error("An unexpected error occurred");
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("User deleted successfully");
        setIsDeleteModalOpen(false);
        window.location.reload();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete user");
      }
    } catch (e) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
          Edit Role
        </Button>
        <Button 
          variant={user.is_active ? "outline" : "default"} 
          size="sm" 
          onClick={handleToggleStatus}
          className={user.is_active ? "text-yellow-600 border-yellow-200 hover:bg-yellow-50" : ""}
        >
          {user.is_active ? "Suspend" : "Activate"}
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsDeleteModalOpen(true)}
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          Delete
        </Button>
      </div>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Role">
        <div className="space-y-6">
          <div>
            <Label className="text-sm font-medium text-gray-700">Role</Label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
              <option value="porter">Porter</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <LoadingButton isLoading={isLoading} onClick={handleUpdateRole} className="bg-blue-600 hover:bg-blue-700">Save Changes</LoadingButton>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete User">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Are you sure you want to delete this user? This action cannot be undone.</p>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <LoadingButton isLoading={isLoading} onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete Permanently</LoadingButton>
          </div>
        </div>
      </Modal>
    </>
  );
}
