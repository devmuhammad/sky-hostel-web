"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/shared/components/ui/data-table";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { Button } from "@/shared/components/ui/button";
import { Modal } from "@/shared/components/ui/modal";
import { DamageReportForm } from "@/features/inventory/components/DamageReportForm";
import { InventoryItemForm } from "@/features/inventory/components/InventoryItemForm";
import { EmptyState } from "@/shared/components/ui/empty-state";
import Link from "next/link";
import { toast } from "sonner";

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIsRoomTemplate, setNewCategoryIsRoomTemplate] = useState(true);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isCreatingItem, setIsCreatingItem] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  const fetchUserRole = async () => {
    try {
      const res = await fetch("/api/admin/users/me");
      const data = await res.json();
      if (data.success && data.data) {
        setCurrentUserRole(data.data.role);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/inventory/items");
      const data = await res.json();
      if (data.success) {
        setItems(data.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load inventory");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/inventory/categories");
      const data = await res.json();
      if (data.success) {
        setCategories(data.data?.categories || []);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load inventory categories");
    }
  };

  useEffect(() => {
    fetchUserRole();
    fetchItems();
    fetchCategories();
  }, []);

  const canViewFinancials = currentUserRole ? ["super_admin", "admin", "hostel_manager", "accountant"].includes(currentUserRole) : false;
  const canAddItem = currentUserRole ? ["super_admin", "admin", "porter", "other"].includes(currentUserRole) : false;

  const handleReportDamage = async (data: any) => {
    const res = await fetch("/api/admin/inventory/damage-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error);
    toast.success("Damage reported successfully");
    setSelectedItem(null);
    fetchItems(); // refresh to show updated condition
  };

  const handleAddItem = async (data: any) => {
    const res = await fetch("/api/admin/inventory/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error);
    toast.success("Item added successfully");
    setIsCreatingItem(false);
    fetchItems();
  };

  const handleCreateCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;

    setIsCreatingCategory(true);
    try {
      const res = await fetch("/api/admin/inventory/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          is_room_template: newCategoryIsRoomTemplate,
        }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);

      toast.success("Category created");
      setNewCategoryName("");
      await fetchCategories();
    } catch (error: any) {
      toast.error(error.message || "Failed to create category");
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const columns = [
    { header: "Name", key: "name", render: (item: any) => item.name },
    {
      header: "Category",
      key: "category",
      render: (item: any) => <span className="capitalize">{item.category_ref?.name || item.category}</span>,
    },
    { 
      header: "Location", 
      key: "room", 
      render: (item: any) => item.room ? 
        <Link href={`/admin/inventory/rooms/${item.room_id}`} className="text-blue-600 hover:underline">
          {item.room.block}{item.room.name.replace(item.room.block, '')}
        </Link> : 
        "General Storage" 
    },
    { 
      header: "Condition", 
      key: "condition", 
      render: (item: any) => {
        const variantMap: any = {
          good: "success",
          needs_repair: "warning",
          spoilt: "error",
          destroyed: "error"
        };
        const labels: any = {
          good: "Good",
          needs_repair: "Needs Repair",
          spoilt: "Spoilt",
          destroyed: "Destroyed"
        };
        return <StatusBadge status={labels[item.condition] || item.condition} variant={variantMap[item.condition] || "default"} />;
      }
    },
    {
      header: "Responsible Student",
      key: "assigned_student",
      render: (item: any) =>
        item.assigned_student
          ? `${item.assigned_student.first_name} ${item.assigned_student.last_name}`
          : "Not Assigned",
    },
    {
      header: "Last Inspection",
      key: "updated_at",
      render: (item: any) =>
        new Date(item.updated_at).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
    },
    { header: "Added On", key: "created_at", render: (item: any) => new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) },
    {
      header: "Actions",
      key: "actions",
      render: (item: any) => (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setSelectedItem(item)}
          disabled={item.condition === 'destroyed'}
        >
          Report Damage
        </Button>
      )
    }
  ];

  const totalValue = items.reduce((sum, item) => sum + (Number(item.price_estimate) || 0), 0);
  const damagedCount = items.filter(i => i.condition !== 'good').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-12 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Hostel Inventory Management</h2>
            <p className="text-sm text-gray-500 mt-1">Track and manage digital assets, rooms, and reported damages.</p>
          </div>
          {canAddItem && (
            <Button onClick={() => setIsCreatingItem(true)} className="rounded-full px-6 whitespace-nowrap">
              Add Item
            </Button>
          )}
        </div>

        {canViewFinancials && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 flex flex-col justify-center">
              <p className="text-sm text-gray-500 font-medium h-5">Total Items</p>
              <p className="text-3xl font-bold text-gray-900 leading-none h-10 flex items-center mt-2">{items.length}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 flex flex-col justify-center">
              <p className="text-sm text-gray-500 font-medium h-5">Items Needing Repair</p>
              <p className="text-3xl font-bold text-red-600 leading-none h-10 flex items-center mt-2">{damagedCount}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 flex flex-col justify-center">
              <p className="text-sm text-gray-500 font-medium h-5">Est. Total Value</p>
              <p className="text-3xl font-bold text-green-600 leading-none h-10 flex items-center mt-2">₦{totalValue.toLocaleString()}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Inventory Categories</h3>
            <p className="text-sm text-gray-500">Create shared categories and mark those that can be attached to room templates.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3">
            <input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g. Study Tables"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={newCategoryIsRoomTemplate}
                onChange={(e) => setNewCategoryIsRoomTemplate(e.target.checked)}
              />
              Room Template
            </label>
            <Button onClick={handleCreateCategory} disabled={isCreatingCategory || !newCategoryName.trim()}>
              {isCreatingCategory ? "Saving..." : "Add Category"}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <span
                key={category.id}
                className={`rounded-full border px-3 py-1 text-xs ${
                  category.is_room_template
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-gray-50 text-gray-700"
                }`}
              >
                {category.name}
              </span>
            ))}
            {categories.length === 0 && (
              <p className="text-sm text-gray-500">No categories configured yet.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {items.length > 0 || isLoading ? (
            <div className="p-1">
              <DataTable 
                data={items} 
                columns={columns} 
                searchFields={["name"]} 
                loading={isLoading} 
                noShadow
              />
            </div>
          ) : (
            <div className="py-12">
              <EmptyState
                title="No Inventory Items"
                description="Your hostel inventory is currently empty."
              />
            </div>
          )}
        </div>
      </div>

      <Modal 
        isOpen={!!selectedItem} 
        onClose={() => setSelectedItem(null)}
        title="Report Damage"
        hideDefaultFooter
      >
        {selectedItem && (
          <DamageReportForm 
            itemId={selectedItem.id} 
            itemName={selectedItem.name} 
            onCancel={() => setSelectedItem(null)}
            onSubmitAction={handleReportDamage}
          />
        )}
      </Modal>

      <Modal
        isOpen={isCreatingItem}
        onClose={() => setIsCreatingItem(false)}
        title="Add Inventory Item"
        hideDefaultFooter
      >
        <InventoryItemForm
          onSubmitAction={handleAddItem}
          onCancel={() => setIsCreatingItem(false)}
        />
      </Modal>
    </div>
  );
}
