import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Preview,
  Section,
  Row,
  Column,
  Hr,
  Img,
} from "@react-email/components";

interface RegistrationConfirmationEmailProps {
  studentName: string;
  matricNumber: string;
  email: string;
  phone: string;
  course: string;
  level: string;
  faculty: string;
  department: string;
  roomNumber: string;
  bedspace: string;
  block: string;
  amountPaid: number;
  amountToPay: number;
  registrationDate: string;
  checkInDate?: string;
  passportPhotoUrl?: string;
}

export const RegistrationConfirmationEmail = ({
  studentName,
  matricNumber,
  email,
  phone,
  course,
  level,
  faculty,
  department,
  roomNumber,
  bedspace,
  block,
  amountPaid,
  amountToPay,
  registrationDate,
  checkInDate,
}: RegistrationConfirmationEmailProps) => {
  const formattedDate = new Date(registrationDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedAmountPaid = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amountPaid);

  const formattedAmountToPay = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amountToPay);

  return (
    <Html>
      <Head />
      <Preview>
        Welcome to Sky Student Hostel - Your registration is confirmed!
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Row>
              <Column>
                <Img
                  src="https://sky-student-hostel.vercel.app/logo.png"
                  alt="Sky Student Hostel Logo"
                  width="120"
                  height="60"
                  style={logo}
                />
                <Text style={tagline}>Your Home Away From Home</Text>
              </Column>
            </Row>
          </Section>

          {/* Main Content */}
          <Section style={mainContent}>
            <Text style={greeting}>Dear {studentName},</Text>

            <Text style={paragraph}>
              Welcome to Sky Student Hostel! Your registration has been
              successfully completed and confirmed. We&apos;re excited to have
              you as part of our hostel community for the 2025/2026 academic
              session.
            </Text>

            {/* Registration Details Card */}
            <Section style={card}>
              <Text style={cardTitle}>📋 Registration Details</Text>

              <Row style={detailRow}>
                <Column style={detailLabel}>
                  <Text style={label}>Registration ID: </Text>
                </Column>
                <Column style={detailValue}>
                  <Text style={value}>{matricNumber}</Text>
                </Column>
              </Row>

              <Row style={detailRow}>
                <Column style={detailLabel}>
                  <Text style={label}>Registration Date:</Text>
                </Column>
                <Column style={detailValue}>
                  <Text style={value}>{formattedDate}</Text>
                </Column>
              </Row>

              <Row style={detailRow}>
                <Column style={detailLabel}>
                  <Text style={label}>Amount Paid:</Text>
                </Column>
                <Column style={detailValue}>
                  <Text style={value}>
                    {formattedAmountPaid} of {formattedAmountToPay}
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* Academic Information */}
            <Section style={card}>
              <Text style={cardTitle}>🎓 Academic Information</Text>

              <Row style={detailRow}>
                <Column style={detailLabel}>
                  <Text style={label}>Course:</Text>
                </Column>
                <Column style={detailValue}>
                  <Text style={value}>{course}</Text>
                </Column>
              </Row>

              <Row style={detailRow}>
                <Column style={detailLabel}>
                  <Text style={label}>Level:</Text>
                </Column>
                <Column style={detailValue}>
                  <Text style={value}>{level}</Text>
                </Column>
              </Row>

              <Row style={detailRow}>
                <Column style={detailLabel}>
                  <Text style={label}>Faculty:</Text>
                </Column>
                <Column style={detailValue}>
                  <Text style={value}>{faculty}</Text>
                </Column>
              </Row>

              <Row style={detailRow}>
                <Column style={detailLabel}>
                  <Text style={label}>Department:</Text>
                </Column>
                <Column style={detailValue}>
                  <Text style={value}>{department}</Text>
                </Column>
              </Row>
            </Section>

            {/* Accommodation Details */}
            <Section style={card}>
              <Text style={cardTitle}>🏠 Accommodation Details</Text>

              <Row style={detailRow}>
                <Column style={detailLabel}>
                  <Text style={label}>Block:</Text>
                </Column>
                <Column style={detailValue}>
                  <Text style={value}>{block}</Text>
                </Column>
              </Row>

              <Row style={detailRow}>
                <Column style={detailLabel}>
                  <Text style={label}>Room Number:</Text>
                </Column>
                <Column style={detailValue}>
                  <Text style={value}>{roomNumber}</Text>
                </Column>
              </Row>

              <Row style={detailRow}>
                <Column style={detailLabel}>
                  <Text style={label}>Bedspace:</Text>
                </Column>
                <Column style={detailValue}>
                  <Text style={value}>{bedspace}</Text>
                </Column>
              </Row>

              {checkInDate && (
                <Row style={detailRow}>
                  <Column style={detailLabel}>
                    <Text style={label}>Check-in Date:</Text>
                  </Column>
                  <Column style={detailValue}>
                    <Text style={value}>
                      {new Date(checkInDate).toLocaleDateString()}
                    </Text>
                  </Column>
                </Row>
              )}
            </Section>

            {/* Contact Information */}
            <Section style={card}>
              <Text style={cardTitle}>📞 Contact Information</Text>

              <Row style={detailRow}>
                <Column style={detailLabel}>
                  <Text style={label}>Email:</Text>
                </Column>
                <Column style={detailValue}>
                  <Text style={value}>{email}</Text>
                </Column>
              </Row>

              <Row style={detailRow}>
                <Column style={detailLabel}>
                  <Text style={label}>Phone:</Text>
                </Column>
                <Column style={detailValue}>
                  <Text style={value}>{phone}</Text>
                </Column>
              </Row>
            </Section>

            {/* Important Information */}
            <Section style={importantCard}>
              <Text style={importantTitle}>⚠️ Important Information</Text>

              <Text style={importantText}>
                • Check-in begins 2 weeks before the academic session starts
              </Text>
              <Text style={importantText}>
                • Please bring your registration confirmation and valid ID
              </Text>
              <Text style={importantText}>
                • Contact us immediately if you need to change your
                accommodation
              </Text>
              <Text style={importantText}>
                • Keep this email for your records
              </Text>
            </Section>

            {/* Support Information */}
            <Section style={supportSection}>
              <Text style={supportTitle}>Need Help?</Text>
              <Text style={supportText}>
                If you have any questions or need assistance, please contact us:
              </Text>

              <Text style={supportContact}>
                📧 Email: mahrikinvltd@gmail.com
              </Text>
              <Text style={supportContact}>📞 Phone: +234 707 581 8778</Text>
              <Text style={supportContact}>
                🌐 Website: https://skyhostel.ng
              </Text>
            </Section>
          </Section>

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              © 2025 Sky Student Hostel. All rights reserved.
            </Text>
            <Text style={footerText}>
              This email was sent to {email}. If you didn&apos;t register for
              our hostel, please ignore this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const header = {
  backgroundColor: "#1f2937",
  padding: "20px 0",
  textAlign: "center" as const,
};

const logo = {
  margin: "0 auto",
  display: "block",
  maxWidth: "300px",
};

const tagline = {
  color: "#9ca3af",
  fontSize: "14px",
  margin: "8px 0 0 0",
};

const mainContent = {
  padding: "0 36px",
};

const greeting = {
  fontSize: "18px",
  fontWeight: "bold",
  margin: "32px 0 16px 0",
  color: "#111827",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "24px",
  margin: "16px 0",
  color: "#374151",
};

const card = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
};

const cardTitle = {
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0 0 16px 0",
  color: "#111827",
};

const detailRow = {
  display: "flex",
  marginBottom: "12px",
};

const detailLabel = {
  width: "40%",
};

const detailValue = {
  width: "60%",
};

const label = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#6b7280",
  margin: "0",
};

const value = {
  fontSize: "14px",
  color: "#111827",
  margin: "0",
};

const importantCard = {
  backgroundColor: "#fef3c7",
  border: "1px solid #f59e0b",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
};

const importantTitle = {
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0 0 16px 0",
  color: "#92400e",
};

const importantText = {
  fontSize: "14px",
  lineHeight: "20px",
  margin: "8px 0",
  color: "#92400e",
};

const supportSection = {
  backgroundColor: "#f0f9ff",
  border: "1px solid #0ea5e9",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
};

const supportTitle = {
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0 0 16px 0",
  color: "#0c4a6e",
};

const supportText = {
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0 0 12px 0",
  color: "#0c4a6e",
};

const supportContact = {
  fontSize: "14px",
  lineHeight: "20px",
  margin: "4px 0",
  color: "#0c4a6e",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "32px 0",
};

const footer = {
  padding: "0 48px",
  textAlign: "center" as const,
};

const footerText = {
  fontSize: "12px",
  color: "#6b7280",
  margin: "8px 0",
};

export default RegistrationConfirmationEmail;
