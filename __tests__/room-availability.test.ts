import { describe, expect, it } from "vitest";
import { computeRoomOccupancy } from "@/shared/utils/room-availability";

describe("computeRoomOccupancy", () => {
  it("locks a filled room even if it is currently open", () => {
    const result = computeRoomOccupancy({
      totalBeds: 4,
      occupiedLabels: [
        "Bed 1 (Top)",
        "Bed 1 (Down)",
        "Bed 2 (Top)",
        "Bed 2 (Down)",
      ],
      reservations: [],
      currentStatus: "open",
    });
    expect(result.status).toBe("locked");
    expect(result.availableBeds).toEqual([]);
  });

  it("opens a previously reserved room that still has free beds", () => {
    const result = computeRoomOccupancy({
      totalBeds: 4,
      occupiedLabels: ["Bed 1 (Top)"],
      reservations: [],
      currentStatus: "reserved",
    });
    expect(result.status).toBe("open");
    expect(result.availableBeds).toEqual([
      "Bed 1 (Down)",
      "Bed 2 (Top)",
      "Bed 2 (Down)",
    ]);
  });

  it("keeps reserved beds out of selectable inventory and names them", () => {
    const result = computeRoomOccupancy({
      totalBeds: 4,
      occupiedLabels: ["Bed 1 (Top)"],
      reservations: [
        { bedspace_label: "Bed 1 (Down)", reserved_for_name: "Jane Doe" },
      ],
      currentStatus: "open",
    });
    expect(result.status).toBe("open");
    expect(result.availableBeds).toEqual(["Bed 2 (Top)", "Bed 2 (Down)"]);
    expect(result.reservations).toEqual([
      { bedspace_label: "Bed 1 (Down)", reserved_for_name: "Jane Doe" },
    ]);
  });

  it("does not auto-open a manually locked room that still has space", () => {
    const result = computeRoomOccupancy({
      totalBeds: 4,
      occupiedLabels: ["Bed 1 (Top)"],
      reservations: [],
      currentStatus: "locked",
    });
    expect(result.status).toBe("locked");
    expect(result.availableBeds.length).toBe(3);
  });

  it("reopens a locked room after a bed is freed", () => {
    const result = computeRoomOccupancy({
      totalBeds: 4,
      occupiedLabels: ["Bed 1 (Top)"],
      reservations: [],
      currentStatus: "locked",
      openIfFreed: true,
    });
    expect(result.status).toBe("open");
  });
});
