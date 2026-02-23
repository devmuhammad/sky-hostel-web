"use client";

import { useCallback, useEffect, useMemo, useState, use } from "react";
import { DataTable } from "@/shared/components/ui/data-table";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { Button } from "@/shared/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { Modal } from "@/shared/components/ui/modal";
import { DamageReportForm } from "@/features/inventory/components/DamageReportForm";

interface InventoryCategory {
  id: string;
  name: string;
  slug: string;
  is_room_template: boolean;
}

interface RoomTemplate {
  id: string;
  expected_quantity: number;
  category: InventoryCategory;
}

export default function RoomInventoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [allCategories, setAllCategories] = useState<InventoryCategory[]>([]);
  const [roomTemplates, setRoomTemplates] = useState<RoomTemplate[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [expectedQuantity, setExpectedQuantity] = useState("1");
  const [reports, setReports] = useState<any[]>([]);
  const [roomInfo, setRoomInfo] = useState<any | null>(null);
  const [reportEdits, setReportEdits] = useState<Record<string, { status: string; action_taken: string }>>({});

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/inventory/items?roomId=${id}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.data || []);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load room inventory");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const fetchRoomInfo = useCallback(async () => {
    try {
      const res = await fetch("/api/rooms?includeFull=true");
      const data = await res.json();
      if (!data.success) return;
      const room = (data.data || []).find((entry: any) => entry.id === id);
      setRoomInfo(room || null);
    } catch (error) {
      console.error(error);
    }
  }, [id]);

  const fetchRoomCategories = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/inventory/categories?roomId=${id}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      const categories = data.data?.categories || [];
      const templates = data.data?.roomTemplates || [];

      setAllCategories(categories);
      setRoomTemplates(templates);

      setSelectedCategoryId((prev) => {
        if (prev || categories.length === 0) return prev;
        const templateCategory = categories.find((category: InventoryCategory) => category.is_room_template);
        return templateCategory?.id || categories[0].id;
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load room category templates");
    }
  }, [id]);

  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/inventory/damage-reports?roomId=${id}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      const nextReports = data.data || [];
      setReports(nextReports);

      const nextEdits: Record<string, { status: string; action_taken: string }> = {};
      for (const report of nextReports) {
        nextEdits[report.id] = {
          status: report.status || "unresolved",
          action_taken: report.action_taken || "",
        };
      }
      setReportEdits(nextEdits);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load room repair requests");
    }
  }, [id]);

  useEffect(() => {
    fetchItems();
    fetchRoomInfo();
    fetchRoomCategories();
    fetchReports();
  }, [fetchItems, fetchRoomInfo, fetchRoomCategories, fetchReports]);

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
    await Promise.all([fetchItems(), fetchReports()]);
  };

  const handleAttachCategory = async () => {
    if (!selectedCategoryId) return;

    try {
      const res = await fetch("/api/admin/inventory/room-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_id: id,
          category_id: selectedCategoryId,
          expected_quantity: Number(expectedQuantity || 1),
        }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);

      toast.success("Category attached to room");
      fetchRoomCategories();
    } catch (error: any) {
      toast.error(error.message || "Failed to attach category");
    }
  };

  const handleRemoveTemplate = async (templateId: string) => {
    try {
      const res = await fetch(`/api/admin/inventory/room-categories?templateId=${templateId}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);

      toast.success("Category removed from room");
      fetchRoomCategories();
    } catch (error: any) {
      toast.error(error.message || "Failed to remove category");
    }
  };

  const handleSaveReportProgress = async (reportId: string) => {
    const state = reportEdits[reportId];
    if (!state) return;

    try {
      const res = await fetch("/api/admin/inventory/damage-reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          status: state.status,
          action_taken: state.action_taken,
        }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);

      toast.success("Repair action progress updated");
      await Promise.all([fetchReports(), fetchItems()]);
    } catch (error: any) {
      toast.error(error.message || "Failed to update report progress");
    }
  };

  const columns = [
    { header: "Name", key: "name", render: (item: any) => item.name },
    {
      header: "Category",
      key: "category",
      render: (item: any) => <span className="capitalize">{item.category}</span>,
    },
    {
      header: "Condition",
      key: "condition",
      render: (item: any) => {
        const variantMap: any = {
          good: "success",
          needs_repair: "warning",
          spoilt: "error",
          destroyed: "error",
        };
        const labels: any = {
          good: "Good",
          needs_repair: "Needs Repair",
          spoilt: "Spoilt",
          destroyed: "Destroyed",
        };
        return <StatusBadge status={labels[item.condition] || item.condition} variant={variantMap[item.condition] || "default"} />;
      },
    },
    {
      header: "Responsible Student",
      key: "assigned_student",
      render: (item: any) =>
        item.assigned_student ? `${item.assigned_student.first_name} ${item.assigned_student.last_name}` : "Not Assigned",
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
    {
      header: "Added On",
      key: "created_at",
      render: (item: any) =>
        new Date(item.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
    },
    {
      header: "Actions",
      key: "actions",
      render: (item: any) => (
        <Button variant="outline" size="sm" onClick={() => setSelectedItem(item)} disabled={item.condition === "destroyed"}>
          Report
        </Button>
      ),
    },
  ];

  const roomName = roomInfo ? `${roomInfo.block}${String(roomInfo.name).replace(roomInfo.block, "")}` : "Room";

  const reportStats = useMemo(() => {
    const unresolved = reports.filter((report) => report.status === "unresolved").length;
    const inProgress = reports.filter((report) => report.status === "in_progress").length;
    const resolved = reports.filter((report) => report.status === "resolved").length;
    return { unresolved, inProgress, resolved, total: reports.length };
  }, [reports]);

  const attachableCategories = allCategories.filter(
    (category) => !roomTemplates.some((template) => template.category?.id === category.id)
  );

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
              <p className="text-sm text-gray-500 mt-1">Manage assets and repair progress for this room.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Room Inventory Categories</h3>
            <p className="text-sm text-gray-500">Attach reusable inventory categories so similar rooms share a standard setup.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_auto] gap-3">
            <select
              value={selectedCategoryId}
              onChange={(event) => setSelectedCategoryId(event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="">Select category</option>
              {attachableCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={expectedQuantity}
              onChange={(event) => setExpectedQuantity(event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Qty"
            />
            <Button onClick={handleAttachCategory} disabled={!selectedCategoryId}>
              Attach
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {roomTemplates.map((template) => (
              <div key={template.id} className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs text-blue-700">
                <span>{template.category?.name} x {template.expected_quantity}</span>
                <button type="button" className="text-blue-900 hover:underline" onClick={() => handleRemoveTemplate(template.id)}>
                  remove
                </button>
              </div>
            ))}
            {roomTemplates.length === 0 && <p className="text-sm text-gray-500">No categories attached to this room yet.</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs uppercase text-gray-500">Total Requests</p>
            <p className="text-2xl font-semibold text-gray-900">{reportStats.total}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs uppercase text-amber-700">Unresolved</p>
            <p className="text-2xl font-semibold text-amber-800">{reportStats.unresolved}</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs uppercase text-blue-700">In Progress</p>
            <p className="text-2xl font-semibold text-blue-800">{reportStats.inProgress}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs uppercase text-emerald-700">Resolved</p>
            <p className="text-2xl font-semibold text-emerald-800">{reportStats.resolved}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-1">
            <DataTable data={items} columns={columns} searchFields={["name"]} loading={isLoading} noShadow />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-900">Room Repair Requests & Actions</h3>
          <p className="text-sm text-gray-500 mt-1">Track reported issues and update progress/actions carried out.</p>

          {reports.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">No repair requests for this room yet.</p>
          ) : (
            <div className="mt-4 space-y-4">
              {reports.map((report) => {
                const state = reportEdits[report.id] || { status: report.status || "unresolved", action_taken: report.action_taken || "" };
                return (
                  <div key={report.id} className="rounded-xl border border-gray-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{report.item?.name || "Unknown Item"}</p>
                        <p className="text-xs text-gray-500">{report.item?.category || "Uncategorized"}</p>
                        <p className="text-sm text-gray-600 mt-2">{report.description}</p>
                      </div>
                      <StatusBadge
                        status={
                          report.status === "resolved"
                            ? "resolved"
                            : report.status === "in_progress"
                              ? "in_progress"
                              : "unresolved"
                        }
                        variant="custom"
                        colorMap={{
                          unresolved: "bg-amber-100 text-amber-800 border-amber-200",
                          in_progress: "bg-blue-100 text-blue-800 border-blue-200",
                          resolved: "bg-emerald-100 text-emerald-800 border-emerald-200",
                        }}
                      />
                    </div>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-[220px_1fr_auto] gap-3">
                      <select
                        value={state.status}
                        onChange={(event) =>
                          setReportEdits((prev) => ({
                            ...prev,
                            [report.id]: {
                              ...state,
                              status: event.target.value,
                            },
                          }))
                        }
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      >
                        <option value="unresolved">Unresolved</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                      <input
                        value={state.action_taken}
                        onChange={(event) =>
                          setReportEdits((prev) => ({
                            ...prev,
                            [report.id]: {
                              ...state,
                              action_taken: event.target.value,
                            },
                          }))
                        }
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        placeholder="Action carried out / progress note"
                      />
                      <Button onClick={() => handleSaveReportProgress(report.id)}>Save</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} title="Report Damage" hideDefaultFooter>
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
