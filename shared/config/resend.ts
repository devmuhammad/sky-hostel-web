import { Resend } from "resend";

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

export { resend };

// Email configuration
export const EMAIL_CONFIG = {
  from: {
    name: "Sky Student Hostel",
    email: "noreply@skyhostel.ng",
  },
  replyTo: "mahrikinvltd@gmail.com",
};

// Email templates
export const EMAIL_TEMPLATES = {
  registrationConfirmation: {
    subject: "Welcome to Sky Student Hostel - Registration Confirmed!",
    template: "registration-confirmation",
  },
  paymentConfirmation: {
    subject: "Payment Received - Sky Student Hostel",
    template: "payment-confirmation",
  },
};
