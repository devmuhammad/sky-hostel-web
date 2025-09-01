import { Button } from "@/shared/components/ui/button";

interface PaymentActionsProps {
  onSyncAll: () => void;
  isSyncingAll: boolean;
  isRefetching?: boolean;
}

export function PaymentActions({
  onSyncAll,
  isSyncingAll,
  isRefetching,
}: PaymentActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold">All Payments</h2>
        {isRefetching && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Auto-refreshing...</span>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          onClick={onSyncAll}
          disabled={isSyncingAll}
          className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
        >
          {isSyncingAll ? "🔄 Syncing..." : "🔄 Sync All"}
        </Button>
      </div>
    </div>
  );
}
