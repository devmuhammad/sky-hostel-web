import { Payment } from "@/shared/store/appStore";

export function findDuplicatePayments(payments: Payment[]) {
  const emailGroups = new Map<string, Payment[]>();

  payments.forEach((payment) => {
    if (!emailGroups.has(payment.email)) {
      emailGroups.set(payment.email, []);
    }
    emailGroups.get(payment.email)!.push(payment);
  });

  const duplicates: any[] = [];

  emailGroups.forEach((paymentsForEmail, email) => {
    if (paymentsForEmail.length > 1) {
      const hasPartialPayment = paymentsForEmail.some(
        (p) => p.status === "partially_paid"
      );
      const hasFullPayment = paymentsForEmail.some(
        (p) => p.status === "completed"
      );
      const totalPending = paymentsForEmail.filter(
        (p) => p.status === "pending"
      ).length;

      let recommendedAction = "";
      if (hasFullPayment) {
        recommendedAction = "Keep completed payment, delete all others";
      } else if (hasPartialPayment) {
        recommendedAction = "Keep partial payment, delete pending duplicates";
      } else if (totalPending > 1) {
        recommendedAction = "Keep most recent pending, delete older pending";
      } else {
        recommendedAction = "No action needed";
      }

      duplicates.push({
        email,
        payments: paymentsForEmail,
        hasPartialPayment,
        hasFullPayment,
        totalPending,
        recommendedAction,
      });
    }
  });

  return duplicates;
}
