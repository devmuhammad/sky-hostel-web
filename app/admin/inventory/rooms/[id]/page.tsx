"use client";

import { useEffect, useState, use } from "react";
import { DataTable } from "@/shared/components/ui/data-table";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { Button } from "@/shared/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { Modal } from "@/shared/components/ui/modal";
import { DamageReportForm } from "@/features/inventory/components/DamageReportForm";

export default function RoomInventoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/inventory/items?roomId=${id}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load room inventory");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [id]);

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


  const columns = [
    { header: "Name", key: "name", render: (item: any) => item.name },
    { header: "Category", key: "category", render: (item: any) => <span className="capitalize">{item.category}</span> },
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
          Report
        </Button>
      )
    }
  ];

  const roomName = items.length > 0 && items[0].room ? `${items[0].room.block}${items[0].room.name.replace(items[0].room.block, '')}` : "Room";

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-12 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200">
          <div className="flex items-center gap-4">
            <Link href="/admin/inventory" className="text-gray-500 hover:text-gray-900 border border-gray-200 rounded-full px-4 py-1.5 text-sm transition-colors">
              &larr; Back
            </Link>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{roomName} Inventory</h2>
              <p className="text-sm text-gray-500 mt-1">Manage assets specifically assigned to this room.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-1">
            <DataTable 
              data={items} 
              columns={columns} 
              searchFields={["name"]} 
              loading={isLoading} 
              noShadow
            />
          </div>
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
    </div>
  );
}
