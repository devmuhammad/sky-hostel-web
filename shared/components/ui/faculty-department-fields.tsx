"use client";

import { Label } from "@/shared/components/ui/label";
import {
  departmentSelectOptions,
  facultySelectOptions,
} from "@/shared/constants/unilorin-academics";

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

interface FacultyDepartmentFieldsProps {
  faculty: string;
  department: string;
  onFacultyChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  facultyError?: string;
  departmentError?: string;
  disabled?: boolean;
  idPrefix?: string;
}

export function FacultyDepartmentFields({
  faculty,
  department,
  onFacultyChange,
  onDepartmentChange,
  facultyError,
  departmentError,
  disabled = false,
  idPrefix = "",
}: FacultyDepartmentFieldsProps) {
  const facultyId = `${idPrefix}faculty`;
  const departmentId = `${idPrefix}department`;
  const facultyOptions = facultySelectOptions();
  const departmentOptions = departmentSelectOptions(faculty);

  return (
    <>
      <div>
        <Label htmlFor={facultyId} className="mb-2">
          Faculty *
        </Label>
        <select
          id={facultyId}
          name="faculty"
          value={faculty}
          disabled={disabled}
          onChange={(event) => onFacultyChange(event.target.value)}
          className={`${selectClassName} ${facultyError ? "border-red-500" : ""}`}
        >
          {facultyOptions.map((option) => (
            <option key={option.value || "empty-faculty"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {facultyError ? (
          <p className="text-red-500 text-sm mt-1">{facultyError}</p>
        ) : null}
      </div>
      <div>
        <Label htmlFor={departmentId} className="mb-2">
          Department *
        </Label>
        <select
          id={departmentId}
          name="department"
          value={department}
          disabled={disabled || !faculty}
          onChange={(event) => onDepartmentChange(event.target.value)}
          className={`${selectClassName} ${departmentError ? "border-red-500" : ""}`}
        >
          {departmentOptions.map((option) => (
            <option
              key={option.value || "empty-department"}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>
        {departmentError ? (
          <p className="text-red-500 text-sm mt-1">{departmentError}</p>
        ) : null}
      </div>
    </>
  );
}
