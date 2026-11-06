export const OTHER_OPTION = "Other";

export const UNILORIN_FACULTY_DEPARTMENTS: Record<string, readonly string[]> = {
  Agriculture: [
    "Agricultural Economics and Farm Management",
    "Agricultural Extension and Rural Development",
    "Agronomy",
    "Animal Production",
    "Crop Protection",
    "Home Economics and Food Science",
    "Forest Resources Management",
    "Aquaculture and Fisheries",
    OTHER_OPTION,
  ],
  Arts: [
    "Arabic",
    "Christian Studies",
    "Comparative Religious Studies",
    "English",
    "French",
    "History and International Studies",
    "Islamic Studies",
    "Linguistics and Nigerian Languages",
    "Performing Arts",
    "Yoruba",
    OTHER_OPTION,
  ],
  "Basic Clinical Sciences": [
    "Chemical Pathology and Immunology",
    "Haematology and Blood Transfusion",
    "Medical Microbiology and Parasitology",
    "Pathology",
    "Pharmacology and Therapeutics",
    OTHER_OPTION,
  ],
  "Basic Medical Sciences": [
    "Anatomy",
    "Medical Biochemistry",
    "Medical Laboratory Science",
    "Physiology",
    "Physiotherapy",
    OTHER_OPTION,
  ],
  "Clinical Sciences": [
    "Medicine",
    "Nursing Science",
    "Anaesthesia",
    "Behavioural Sciences",
    "Epidemiology and Community Health",
    "Family Medicine",
    "Obstetrics and Gynaecology",
    "Ophthalmology",
    "Otorhinolaryngology",
    "Paediatrics and Child Health",
    "Radiology",
    "Surgery",
    OTHER_OPTION,
  ],
  "Communication and Information Sciences": [
    "Computer Science",
    "Information and Communication Science",
    "Library and Information Science",
    "Mass Communication",
    "Telecommunication Science",
    OTHER_OPTION,
  ],
  Education: [
    "Adult and Primary Education",
    "Arts Education",
    "Business Education",
    "Counsellor Education",
    "Educational Management",
    "Educational Technology",
    "Health Promotion and Environmental Health Education",
    "Human Kinetics Education",
    "Science Education",
    "Social Sciences Education",
    OTHER_OPTION,
  ],
  "Engineering and Technology": [
    "Agricultural and Biosystems Engineering",
    "Biomedical Engineering",
    "Chemical Engineering",
    "Civil Engineering",
    "Computer Engineering",
    "Electrical and Electronics Engineering",
    "Food and Bioprocess Engineering",
    "Materials and Metallurgical Engineering",
    "Mechanical Engineering",
    "Water Resources and Environmental Engineering",
    OTHER_OPTION,
  ],
  "Environmental Sciences": [
    "Architecture",
    "Estate Management",
    "Quantity Surveying",
    "Surveying and Geoinformatics",
    "Urban and Regional Planning",
    OTHER_OPTION,
  ],
  Law: ["Common Law", "Islamic Law", OTHER_OPTION],
  "Life Sciences": [
    "Biochemistry",
    "Microbiology",
    "Optometry and Vision Science",
    "Plant Biology",
    "Zoology",
    OTHER_OPTION,
  ],
  "Management Sciences": [
    "Accounting",
    "Business Administration",
    "Finance",
    "Industrial Relations and Personnel Management",
    "Marketing",
    "Public Administration",
    OTHER_OPTION,
  ],
  "Pharmaceutical Sciences": [
    "Pharmacy",
    "Clinical Pharmacy and Pharmacy Practice",
    "Pharmaceutical and Medicinal Chemistry",
    "Pharmaceutics and Industrial Pharmacy",
    "Pharmacognosy and Drug Development",
    "Pharmacology and Toxicology",
    OTHER_OPTION,
  ],
  "Physical Sciences": [
    "Chemistry",
    "Geology and Mineral Science",
    "Geophysics",
    "Industrial Chemistry",
    "Mathematics",
    "Physics",
    "Statistics",
    OTHER_OPTION,
  ],
  "Social Sciences": [
    "Criminology and Security Studies",
    "Economics",
    "Geography and Environmental Management",
    "Political Science",
    "Psychology",
    "Social Work",
    "Sociology",
    OTHER_OPTION,
  ],
  "Veterinary Medicine": [
    "Veterinary Medicine",
    "Veterinary Anatomy",
    "Veterinary Microbiology",
    "Veterinary Parasitology and Entomology",
    "Veterinary Pathology",
    "Veterinary Pharmacology and Toxicology",
    "Veterinary Physiology and Biochemistry",
    "Veterinary Public Health and Preventive Medicine",
    "Veterinary Surgery and Radiology",
    "Theriogenology and Production",
    OTHER_OPTION,
  ],
  Other: [OTHER_OPTION],
};

export const UNILORIN_FACULTIES = Object.keys(UNILORIN_FACULTY_DEPARTMENTS);

const FACULTY_ALIASES: Record<string, string> = {
  agric: "Agriculture",
  agriculture: "Agriculture",
  agricultural: "Agriculture",
  "faculty of agriculture": "Agriculture",
  "faculty of agric": "Agriculture",
  arts: "Arts",
  "faculty of arts": "Arts",
  "basic clinical": "Basic Clinical Sciences",
  "basic clinical sciences": "Basic Clinical Sciences",
  "faculty of basic clinical sciences": "Basic Clinical Sciences",
  bcs: "Basic Clinical Sciences",
  "basic medical": "Basic Medical Sciences",
  "basic medical sciences": "Basic Medical Sciences",
  "faculty of basic medical sciences": "Basic Medical Sciences",
  bms: "Basic Medical Sciences",
  clinical: "Clinical Sciences",
  "clinical sciences": "Clinical Sciences",
  "faculty of clinical sciences": "Clinical Sciences",
  "college of health sciences": "Clinical Sciences",
  "health sciences": "Clinical Sciences",
  chs: "Clinical Sciences",
  cis: "Communication and Information Sciences",
  "communication and information sciences":
    "Communication and Information Sciences",
  "communication information sciences":
    "Communication and Information Sciences",
  "faculty of cis": "Communication and Information Sciences",
  "faculty of communication and information sciences":
    "Communication and Information Sciences",
  communication: "Communication and Information Sciences",
  education: "Education",
  "faculty of education": "Education",
  edu: "Education",
  engineering: "Engineering and Technology",
  "engineering and technology": "Engineering and Technology",
  "faculty of engineering": "Engineering and Technology",
  "faculty of engineering and technology": "Engineering and Technology",
  foe: "Engineering and Technology",
  eng: "Engineering and Technology",
  environmental: "Environmental Sciences",
  "environmental sciences": "Environmental Sciences",
  "faculty of environmental sciences": "Environmental Sciences",
  env: "Environmental Sciences",
  law: "Law",
  "faculty of law": "Law",
  "life sciences": "Life Sciences",
  "faculty of life sciences": "Life Sciences",
  "life science": "Life Sciences",
  "management sciences": "Management Sciences",
  "management science": "Management Sciences",
  management: "Management Sciences",
  fms: "Management Sciences",
  "faculty of management sciences": "Management Sciences",
  "faculty of social and management sciences": "Management Sciences",
  pharmacy: "Pharmaceutical Sciences",
  pharmaceutical: "Pharmaceutical Sciences",
  "pharmaceutical sciences": "Pharmaceutical Sciences",
  "faculty of pharmaceutical sciences": "Pharmaceutical Sciences",
  "faculty of pharmacy": "Pharmaceutical Sciences",
  pharm: "Pharmaceutical Sciences",
  "physical sciences": "Physical Sciences",
  "physical science": "Physical Sciences",
  "faculty of physical sciences": "Physical Sciences",
  "social sciences": "Social Sciences",
  "social science": "Social Sciences",
  "faculty of social sciences": "Social Sciences",
  veterinary: "Veterinary Medicine",
  "veterinary medicine": "Veterinary Medicine",
  "faculty of veterinary medicine": "Veterinary Medicine",
  vet: "Veterinary Medicine",
  other: OTHER_OPTION,
  others: OTHER_OPTION,
  na: OTHER_OPTION,
  n: OTHER_OPTION,
  none: OTHER_OPTION,
  nil: OTHER_OPTION,
};

const DEPARTMENT_ALIASES: Record<string, string> = {
  "agricultural economics": "Agricultural Economics and Farm Management",
  "agricultural economics and farm management":
    "Agricultural Economics and Farm Management",
  "agric economics": "Agricultural Economics and Farm Management",
  "agricultural extension": "Agricultural Extension and Rural Development",
  "agricultural extension and rural development":
    "Agricultural Extension and Rural Development",
  agronomy: "Agronomy",
  "animal production": "Animal Production",
  "crop protection": "Crop Protection",
  "home economics": "Home Economics and Food Science",
  "home economics and food science": "Home Economics and Food Science",
  "food science": "Home Economics and Food Science",
  forestry: "Forest Resources Management",
  "forest resources management": "Forest Resources Management",
  fisheries: "Aquaculture and Fisheries",
  aquaculture: "Aquaculture and Fisheries",
  "aquaculture and fisheries": "Aquaculture and Fisheries",
  arabic: "Arabic",
  english: "English",
  "english language": "English",
  french: "French",
  history: "History and International Studies",
  "history and international studies": "History and International Studies",
  "international studies": "History and International Studies",
  linguistics: "Linguistics and Nigerian Languages",
  "linguistics and nigerian languages": "Linguistics and Nigerian Languages",
  "performing arts": "Performing Arts",
  theatre: "Performing Arts",
  yoruba: "Yoruba",
  "christian studies": "Christian Studies",
  "islamic studies": "Islamic Studies",
  "comparative religious studies": "Comparative Religious Studies",
  religions: "Comparative Religious Studies",
  "religious studies": "Comparative Religious Studies",
  anatomy: "Anatomy",
  physiology: "Physiology",
  physiotherapy: "Physiotherapy",
  "medical biochemistry": "Medical Biochemistry",
  mls: "Medical Laboratory Science",
  "medical laboratory science": "Medical Laboratory Science",
  "medical lab science": "Medical Laboratory Science",
  medicine: "Medicine",
  mbbs: "Medicine",
  "medicine and surgery": "Medicine",
  "m b b s": "Medicine",
  nursing: "Nursing Science",
  "nursing science": "Nursing Science",
  "nursing sciences": "Nursing Science",
  bnsc: "Nursing Science",
  dentistry: OTHER_OPTION,
  computer: "Computer Science",
  csc: "Computer Science",
  "computer science": "Computer Science",
  "computer sci": "Computer Science",
  ics: "Information and Communication Science",
  "information and communication science": "Information and Communication Science",
  "information science": "Information and Communication Science",
  lis: "Library and Information Science",
  "library and information science": "Library and Information Science",
  "library science": "Library and Information Science",
  "mass communication": "Mass Communication",
  "mass comm": "Mass Communication",
  "mass comms": "Mass Communication",
  telecommunication: "Telecommunication Science",
  "telecommunication science": "Telecommunication Science",
  "telecom science": "Telecommunication Science",
  "adult education": "Adult and Primary Education",
  "adult and primary education": "Adult and Primary Education",
  "arts education": "Arts Education",
  "business education": "Business Education",
  "counsellor education": "Counsellor Education",
  "guidance and counselling": "Counsellor Education",
  "educational management": "Educational Management",
  "edu management": "Educational Management",
  "educational technology": "Educational Technology",
  "health education": "Health Promotion and Environmental Health Education",
  "health promotion and environmental health education":
    "Health Promotion and Environmental Health Education",
  "human kinetics": "Human Kinetics Education",
  "human kinetics education": "Human Kinetics Education",
  "physical education": "Human Kinetics Education",
  "science education": "Science Education",
  "social sciences education": "Social Sciences Education",
  "social science education": "Social Sciences Education",
  "agric engineering": "Agricultural and Biosystems Engineering",
  "agricultural engineering": "Agricultural and Biosystems Engineering",
  "agricultural and biosystems engineering":
    "Agricultural and Biosystems Engineering",
  "biomedical engineering": "Biomedical Engineering",
  "chemical engineering": "Chemical Engineering",
  "civil engineering": "Civil Engineering",
  civil: "Civil Engineering",
  "computer engineering": "Computer Engineering",
  "electrical engineering": "Electrical and Electronics Engineering",
  "electrical and electronics engineering":
    "Electrical and Electronics Engineering",
  "electrical electronics engineering":
    "Electrical and Electronics Engineering",
  eee: "Electrical and Electronics Engineering",
  "food engineering": "Food and Bioprocess Engineering",
  "food and bioprocess engineering": "Food and Bioprocess Engineering",
  "materials engineering": "Materials and Metallurgical Engineering",
  "metallurgical engineering": "Materials and Metallurgical Engineering",
  "materials and metallurgical engineering":
    "Materials and Metallurgical Engineering",
  "mechanical engineering": "Mechanical Engineering",
  mechanical: "Mechanical Engineering",
  "water resources engineering": "Water Resources and Environmental Engineering",
  "water resources and environmental engineering":
    "Water Resources and Environmental Engineering",
  architecture: "Architecture",
  "estate management": "Estate Management",
  "quantity surveying": "Quantity Surveying",
  qs: "Quantity Surveying",
  surveying: "Surveying and Geoinformatics",
  "surveying and geoinformatics": "Surveying and Geoinformatics",
  "urban and regional planning": "Urban and Regional Planning",
  urp: "Urban and Regional Planning",
  "common law": "Common Law",
  llb: "Common Law",
  "ll b": "Common Law",
  "islamic law": "Islamic Law",
  biochemistry: "Biochemistry",
  microbiology: "Microbiology",
  optometry: "Optometry and Vision Science",
  "optometry and vision science": "Optometry and Vision Science",
  "plant biology": "Plant Biology",
  botany: "Plant Biology",
  zoology: "Zoology",
  accounting: "Accounting",
  accountancy: "Accounting",
  "business administration": "Business Administration",
  busadmin: "Business Administration",
  finance: "Finance",
  "banking and finance": "Finance",
  marketing: "Marketing",
  "public administration": "Public Administration",
  pad: "Public Administration",
  irpm: "Industrial Relations and Personnel Management",
  "industrial relations": "Industrial Relations and Personnel Management",
  "industrial relations and personnel management":
    "Industrial Relations and Personnel Management",
  "human resource management": "Industrial Relations and Personnel Management",
  pharmacy: "Pharmacy",
  "b pharm": "Pharmacy",
  bpharm: "Pharmacy",
  "clinical pharmacy": "Clinical Pharmacy and Pharmacy Practice",
  chemistry: "Chemistry",
  "industrial chemistry": "Industrial Chemistry",
  geology: "Geology and Mineral Science",
  "geology and mineral science": "Geology and Mineral Science",
  geophysics: "Geophysics",
  mathematics: "Mathematics",
  maths: "Mathematics",
  physics: "Physics",
  statistics: "Statistics",
  criminology: "Criminology and Security Studies",
  "criminology and security studies": "Criminology and Security Studies",
  economics: "Economics",
  geography: "Geography and Environmental Management",
  "geography and environmental management":
    "Geography and Environmental Management",
  "political science": "Political Science",
  "political science and international relations": "Political Science",
  psychology: "Psychology",
  "social work": "Social Work",
  sociology: "Sociology",
  "veterinary medicine": "Veterinary Medicine",
  dvm: "Veterinary Medicine",
  other: OTHER_OPTION,
  others: OTHER_OPTION,
  na: OTHER_OPTION,
  none: OTHER_OPTION,
  nil: OTHER_OPTION,
};

export type NormalizedAcademics = {
  faculty: string;
  department: string;
  changed: boolean;
  matchedBy: "exact" | "alias" | "department" | "fallback";
};

function collapseKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\b(faculty|dept|department|school|college)\s+of\b/g, " ")
    .replace(/\b(b\.?\s*sc|b\.?\s*a|b\.?\s*eng|b\.?\s*tech|b\.?\s*ed|ll\.?\s*b|m\.?\s*b\.?\s*b\.?\s*s|b\.?\s*pharm|b\.?\s*nsc)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findCanonicalFaculty(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (UNILORIN_FACULTY_DEPARTMENTS[trimmed]) return trimmed;

  const key = collapseKey(trimmed);
  if (!key) return null;
  if (FACULTY_ALIASES[key]) return FACULTY_ALIASES[key];

  for (const faculty of UNILORIN_FACULTIES) {
    if (collapseKey(faculty) === key) return faculty;
  }

  for (const faculty of UNILORIN_FACULTIES) {
    const facultyKey = collapseKey(faculty);
    if (facultyKey && (key.includes(facultyKey) || facultyKey.includes(key))) {
      return faculty;
    }
  }

  return null;
}

function departmentLookup(): Map<string, { faculty: string; department: string }[]> {
  const map = new Map<string, { faculty: string; department: string }[]>();
  const add = (raw: string, faculty: string, department: string) => {
    const key = collapseKey(raw);
    if (!key) return;
    const current = map.get(key) || [];
    if (!current.some((item) => item.faculty === faculty && item.department === department)) {
      current.push({ faculty, department });
      map.set(key, current);
    }
  };

  for (const [faculty, departments] of Object.entries(UNILORIN_FACULTY_DEPARTMENTS)) {
    for (const department of departments) {
      add(department, faculty, department);
    }
  }

  for (const [alias, department] of Object.entries(DEPARTMENT_ALIASES)) {
    const owners = findDepartmentOwners(department);
    for (const owner of owners) {
      add(alias, owner.faculty, owner.department);
    }
  }

  return map;
}

function findDepartmentOwners(department: string): { faculty: string; department: string }[] {
  const owners: { faculty: string; department: string }[] = [];
  for (const [faculty, departments] of Object.entries(UNILORIN_FACULTY_DEPARTMENTS)) {
    if (departments.includes(department)) {
      owners.push({ faculty, department });
    }
  }
  return owners;
}

const DEPARTMENT_LOOKUP = departmentLookup();

function findCanonicalDepartment(
  value: string | null | undefined,
  facultyHint?: string | null
): { faculty: string; department: string } | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (facultyHint && UNILORIN_FACULTY_DEPARTMENTS[facultyHint]?.includes(trimmed)) {
    return { faculty: facultyHint, department: trimmed };
  }

  const key = collapseKey(trimmed);
  if (!key) return null;

  const matches = DEPARTMENT_LOOKUP.get(key) || [];
  if (facultyHint) {
    const inFaculty = matches.filter((item) => item.faculty === facultyHint);
    if (inFaculty.length === 1) return inFaculty[0];
  }
  if (matches.length === 1) return matches[0];

  if (facultyHint) {
    const departments = UNILORIN_FACULTY_DEPARTMENTS[facultyHint] || [];
    for (const department of departments) {
      const departmentKey = collapseKey(department);
      if (
        departmentKey &&
        department !== OTHER_OPTION &&
        (key.includes(departmentKey) || departmentKey.includes(key))
      ) {
        return { faculty: facultyHint, department };
      }
    }
  }

  const fuzzy: { faculty: string; department: string }[] = [];
  for (const [faculty, departments] of Object.entries(UNILORIN_FACULTY_DEPARTMENTS)) {
    for (const department of departments) {
      if (department === OTHER_OPTION) continue;
      const departmentKey = collapseKey(department);
      if (
        departmentKey &&
        (key.includes(departmentKey) || departmentKey.includes(key))
      ) {
        fuzzy.push({ faculty, department });
      }
    }
  }
  if (facultyHint) {
    const inFaculty = fuzzy.filter((item) => item.faculty === facultyHint);
    if (inFaculty.length === 1) return inFaculty[0];
  }
  if (fuzzy.length === 1) return fuzzy[0];

  return null;
}

export function getDepartmentsForFaculty(faculty: string): string[] {
  const departments = UNILORIN_FACULTY_DEPARTMENTS[faculty];
  if (!departments) return [OTHER_OPTION];
  return [...departments];
}

export function isCanonicalFaculty(faculty: string): boolean {
  return Boolean(faculty && UNILORIN_FACULTY_DEPARTMENTS[faculty]);
}

export function isCanonicalDepartment(faculty: string, department: string): boolean {
  return Boolean(
    faculty &&
      department &&
      UNILORIN_FACULTY_DEPARTMENTS[faculty]?.includes(department)
  );
}

export function facultySelectOptions(): Array<{ value: string; label: string }> {
  return [
    { value: "", label: "Select faculty" },
    ...UNILORIN_FACULTIES.map((faculty) => ({
      value: faculty,
      label: faculty === OTHER_OPTION ? "Other" : faculty,
    })),
  ];
}

export function departmentSelectOptions(
  faculty: string
): Array<{ value: string; label: string }> {
  const departments = getDepartmentsForFaculty(faculty);
  return [
    { value: "", label: faculty ? "Select department" : "Select faculty first" },
    ...departments.map((department) => ({
      value: department,
      label: department,
    })),
  ];
}

export function normalizeStudentAcademics(
  faculty?: string | null,
  department?: string | null,
  course?: string | null
): NormalizedAcademics {
  const originalFaculty = (faculty || "").trim();
  const originalDepartment = (department || "").trim();

  const resolvedFaculty = findCanonicalFaculty(originalFaculty);
  const resolvedFromDepartment = findCanonicalDepartment(
    originalDepartment,
    resolvedFaculty
  );
  const resolvedFromCourse = course
    ? findCanonicalDepartment(course, resolvedFaculty || resolvedFromDepartment?.faculty)
    : null;

  let nextFaculty = resolvedFaculty;
  let nextDepartment = resolvedFromDepartment?.department || null;
  let matchedBy: NormalizedAcademics["matchedBy"] = "fallback";

  if (resolvedFromDepartment) {
    matchedBy = resolvedFaculty && resolvedFromDepartment.faculty === resolvedFaculty
      ? resolvedFaculty === originalFaculty &&
        resolvedFromDepartment.department === originalDepartment
        ? "exact"
        : "alias"
      : "department";
    if (!nextFaculty || nextFaculty === OTHER_OPTION) {
      nextFaculty = resolvedFromDepartment.faculty;
    } else if (nextFaculty !== resolvedFromDepartment.faculty) {
      nextFaculty = resolvedFromDepartment.faculty;
      matchedBy = "department";
    }
  } else if (resolvedFromCourse) {
    nextDepartment = resolvedFromCourse.department;
    nextFaculty = nextFaculty && nextFaculty !== OTHER_OPTION
      ? resolvedFromCourse.faculty === nextFaculty
        ? nextFaculty
        : resolvedFromCourse.faculty
      : resolvedFromCourse.faculty;
    matchedBy = "alias";
  }

  if (!nextFaculty) nextFaculty = OTHER_OPTION;
  if (!nextDepartment) {
    nextDepartment = OTHER_OPTION;
    if (matchedBy === "fallback" && resolvedFaculty) matchedBy = "alias";
  }

  if (!isCanonicalDepartment(nextFaculty, nextDepartment)) {
    nextDepartment = OTHER_OPTION;
  }

  return {
    faculty: nextFaculty,
    department: nextDepartment,
    changed:
      nextFaculty !== originalFaculty || nextDepartment !== originalDepartment,
    matchedBy,
  };
}
