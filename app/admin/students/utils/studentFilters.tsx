"use client";

import { Filter } from "@/shared/components/ui/data-table";
import { Student } from "@/shared/store/appStore";

export function getStudentFilters(
  students: Student[],
  filterFaculty: string,
  setFilterFaculty: (value: string) => void,
  filterLevel: string,
  setFilterLevel: (value: string) => void
): Filter[] {
  const faculties = [...new Set(students.map((s) => s.faculty))].filter(
    (faculty): faculty is string => Boolean(faculty)
  );
  const levels = [...new Set(students.map((s) => s.level))].filter(
    (level): level is string => Boolean(level)
  );

  return [
    {
      key: "faculty",
      label: "Faculty",
      options: faculties.map((faculty) => ({
        value: faculty,
        label: faculty,
      })),
      value: filterFaculty,
      onChange: setFilterFaculty,
    },
    {
      key: "level",
      label: "Level",
      options: levels.map((level) => ({
        value: level,
        label: level,
      })),
      value: filterLevel,
      onChange: setFilterLevel,
    },
  ];
}

export function filterStudents(
  students: Student[],
  filterFaculty: string,
  filterLevel: string
): Student[] {
  return students.filter((student) => {
    const facultyMatch = !filterFaculty || student.faculty === filterFaculty;
    const levelMatch = !filterLevel || student.level === filterLevel;
    return facultyMatch && levelMatch;
  });
}
