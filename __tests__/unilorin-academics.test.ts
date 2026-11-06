import { describe, expect, it } from "vitest";
import {
  isCanonicalDepartment,
  isCanonicalFaculty,
  normalizeStudentAcademics,
} from "@/shared/constants/unilorin-academics";

describe("normalizeStudentAcademics", () => {
  it("keeps canonical Unilorin pairs", () => {
    const result = normalizeStudentAcademics(
      "Communication and Information Sciences",
      "Computer Science"
    );
    expect(result).toMatchObject({
      faculty: "Communication and Information Sciences",
      department: "Computer Science",
      changed: false,
    });
  });

  it("maps common aliases and abbreviations", () => {
    expect(normalizeStudentAcademics("CIS", "CSC")).toMatchObject({
      faculty: "Communication and Information Sciences",
      department: "Computer Science",
      changed: true,
    });
    expect(normalizeStudentAcademics("Engineering", "EEE")).toMatchObject({
      faculty: "Engineering and Technology",
      department: "Electrical and Electronics Engineering",
    });
    expect(normalizeStudentAcademics("FMS", "accountancy")).toMatchObject({
      faculty: "Management Sciences",
      department: "Accounting",
    });
  });

  it("uses the department to correct a mismatched faculty", () => {
    expect(
      normalizeStudentAcademics("Engineering", "Computer Science")
    ).toMatchObject({
      faculty: "Communication and Information Sciences",
      department: "Computer Science",
    });
  });

  it("falls back to Other when nothing matches", () => {
    const result = normalizeStudentAcademics("Unknown Faculty", "Unknown Dept");
    expect(result).toMatchObject({
      faculty: "Other",
      department: "Other",
      changed: true,
    });
  });

  it("accepts Other as a valid selection", () => {
    expect(isCanonicalFaculty("Other")).toBe(true);
    expect(isCanonicalDepartment("Other", "Other")).toBe(true);
    expect(
      isCanonicalDepartment("Communication and Information Sciences", "Other")
    ).toBe(true);
  });
});
