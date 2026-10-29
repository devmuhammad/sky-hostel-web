import { describe, expect, it } from "vitest";
import { computeHostelStats } from "@/shared/utils/hostel-stats";

describe("Dashboard stats occupancy formula", () => {
  it("rounds occupied / total beds", () => {
    const stats = computeHostelStats({
      sessionLabel: "2026/2027",
      rooms: [{ total_beds: 4 }, { total_beds: 4 }],
      payments: [],
      students: [
        { block: "A", room: "1", bedspace_label: "Bed 1 (Top)" },
        { block: "A", room: "1", bedspace_label: "Bed 1 (Down)" },
        { block: "B", room: "1", bedspace_label: "Bed 1 (Top)" },
        { block: "B", room: "1", bedspace_label: "Bed 1 (Down)" },
        { block: "B", room: "2", bedspace_label: "Bed 2 (Top)" },
        { block: "B", room: "2", bedspace_label: "Bed 2 (Down)" },
      ],
    });

    expect(stats.totalBeds).toBe(8);
    expect(stats.occupiedBeds).toBe(6);
    expect(stats.occupancyRate).toBe(75);
  });
});
