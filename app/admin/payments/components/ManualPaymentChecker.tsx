import { CardContainer } from "@/shared/components/ui/card-container";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

interface ManualPaymentCheckerProps {
  email: string;
  onEmailChange: (email: string) => void;
  onCheck: () => void;
  isChecking: boolean;
}

export function ManualPaymentChecker({
  email,
  onEmailChange,
  onCheck,
  isChecking,
}: ManualPaymentCheckerProps) {
  return (
    <CardContainer>
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          Manual Payment Status Checker
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Check and update payment status for a specific email address. This
          tool helps verify Paycashless payments including partial payments from
          INVOICE_PAYMENT_SUCCEEDED events.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <Label htmlFor="manual-email">Email Address</Label>
            <Input
              id="manual-email"
              type="email"
              placeholder="Enter student email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              className="mt-1"
            />
          </div>
          <Button
            onClick={onCheck}
            disabled={isChecking || !email.trim()}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          >
            {isChecking ? "Checking..." : "🔍 Check Status"}
          </Button>
        </div>
      </div>
    </CardContainer>
  );
}
