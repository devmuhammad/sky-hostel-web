import { describe, expect, it } from "vitest";
import { computeHostelStats } from "@/shared/utils/hostel-stats";

const session = "2026/2027";

describe("computeHostelStats", () => {
  it("counts only current-session, still-active students", () => {
    const stats = computeHostelStats({
      sessionLabel: session,
      rooms: [{ total_beds: 4 }],
      payments: [],
      students: [
        {
          enrollment_session: session,
          is_active: true,
          created_at: "2026-08-01T00:00:00Z",
        },
        {
          enrollment_session: session,
          is_active: false,
          created_at: "2026-08-02T00:00:00Z",
        },
        {
          enrollment_session: session,
          account_status: "blacklisted",
          created_at: "2026-08-03T00:00:00Z",
        },
        {
          enrollment_session: "2025/2026",
          is_active: true,
          created_at: "2025-08-01T00:00:00Z",
        },
        {
          enrollment_session: null,
          is_active: true,
          created_at: "2026-09-01T00:00:00Z",
        },
      ],
    });

    expect(stats.totalStudents).toBe(2);
  });

  it("uses cash actually received, not the invoice total", () => {
    const stats = computeHostelStats({
      sessionLabel: session,
      rooms: [],
      students: [],
      payments: [
        {
          session_label: session,
          status: "completed",
          amount_paid: 255700,
          payment_source: "paycashless",
        },
        {
          session_label: session,
          status: "partially_paid",
          amount_paid: 100000,
          payment_source: "paycashless",
        },
        {
          session_label: session,
          status: "pending",
          amount_paid: 0,
          payment_source: "paycashless",
        },
        {
          session_label: session,
          status: "completed",
          amount_paid: 255700,
          payment_source: "waived",
        },
        {
          session_label: "2025/2026",
          status: "completed",
          amount_paid: 219000,
          payment_source: "paycashless",
        },
      ],
    });

    expect(stats.totalRevenue).toBe(355700);
    expect(stats.completedPayments).toBe(2);
    expect(stats.collectedPayments).toBe(2);
  });

  it("counts occupancy from assigned students, not available_beds", () => {
    const stats = computeHostelStats({
      sessionLabel: session,
      rooms: [
        { total_beds: 4 },
        { total_beds: 4 },
      ],
      payments: [],
      students: [
        {
          enrollment_session: session,
          block: "A",
          room: "1",
          bedspace_label: "Bed 1 (Top)",
        },
        {
          enrollment_session: session,
          block: "A",
          room: "1",
          bedspace_label: "Bed 1 (Down)",
        },
        {
          enrollment_session: session,
          block: "A",
          room: "2",
        },
      ],
    });

    expect(stats.totalBeds).toBe(8);
    expect(stats.occupiedBeds).toBe(2);
    expect(stats.occupancyRate).toBe(25);
  });
});
