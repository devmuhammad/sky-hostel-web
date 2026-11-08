import { describe, expect, it } from "vitest";
import {
  isPaymentRefunded,
  isStudentBlocked,
} from "@/shared/utils/student-eligibility";

describe("isStudentBlocked", () => {
  it("allows active students", () => {
    expect(
      isStudentBlocked({ is_active: true, account_status: "active" })
    ).toBe(false);
  });

  it("blocks withdrawn, blacklisted, and inactive students", () => {
    expect(
      isStudentBlocked({ is_active: true, account_status: "withdrawn" })
    ).toBe(true);
    expect(
      isStudentBlocked({ is_active: false, account_status: "blacklisted" })
    ).toBe(true);
    expect(isStudentBlocked({ is_active: false, account_status: "active" })).toBe(
      true
    );
  });
});

describe("isPaymentRefunded", () => {
  it("detects refunded payments", () => {
    expect(isPaymentRefunded({ status: "refunded" })).toBe(true);
    expect(isPaymentRefunded({ status: "completed" })).toBe(false);
  });
});
