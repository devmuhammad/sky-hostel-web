export const PAYMENT_CONFIG = {
  // For Testing: 1000
  // For Production: 219000
  amount: 1000,
  get amountInKobo() {
    return this.amount * 100;
  },

  // Helper methods
  formatAmount(): string {
    return `₦${this.amount.toLocaleString()}`;
  },

  // Quick switch functions (for easy testing)
  setTestAmount() {
    this.amount = 1000;
  },

  setProductionAmount() {
    this.amount = 219000;
  },
};

// Other app constants can go here
export const APP_CONFIG = {
  name: "Sky Student Hostel",
  supportEmail: "support@skyhostel.com",
  maxInstallments: 3,
  invoiceDueDays: 7,
};
