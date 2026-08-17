export const RESUMPTION_SESSION = "2026/2027";

export const RESUMPTION_DOCUMENTS = [
  {
    id: "rules",
    title: "Rules & Regulations",
    description:
      "Cleanliness, conduct, pest control & resumption rules for the academic session.",
    href: "/documents/rules-regulations-2026-2027.pdf",
    filename: "rules-regulations-2026-2027.pdf",
  },
  {
    id: "agreement",
    title: "Resumption Agreement & Checklist",
    description:
      "Mandatory packing checklist and signed agreement for you and your parent/guardian.",
    href: "/documents/resumption-agreement-checklist.pdf",
    filename: "resumption-agreement-checklist.pdf",
  },
  {
    id: "gate",
    title: "Gate Verification Checklist",
    description:
      "Porter verification form — bring this printed copy to the gate on resumption day.",
    href: "/documents/gate-verification-checklist.pdf",
    filename: "gate-verification-checklist.pdf",
  },
] as const;

export const RESUMPTION_CHECKLIST_SEED = [
  {
    code: "insecticide",
    label: "1 Bottle of Insecticide (Fresh supply for 4 months)",
    sort_order: 1,
  },
  { code: "bedsheets", label: "2 Bedsheets", sort_order: 2 },
  { code: "bedcovers", label: "2 Bedcovers", sort_order: 3 },
  { code: "pillow_cases", label: "2 Pillow cases", sort_order: 4 },
  { code: "mop", label: "1 Mop", sort_order: 5 },
  { code: "broom", label: "1 Broom", sort_order: 6 },
  { code: "dustbin", label: "1 Dustbin", sort_order: 7 },
  {
    code: "sponges_brushes",
    label: "Iron Sponges & Wall Scrub Brushes",
    sort_order: 8,
  },
  { code: "toilet_wash", label: "Toilet Wash", sort_order: 9 },
  { code: "sink_sieve", label: "Kitchen Sink Sieve", sort_order: 10 },
  {
    code: "airtight_container",
    label: "Airtight Food Container (No Sacks, Bags, or Nylons)",
    sort_order: 11,
  },
  {
    code: "signed_agreement",
    label: "Signed Resumption Agreement Form submitted",
    sort_order: 12,
  },
  {
    code: "blacklist_clear",
    label: "Student name checked against DSA Blacklist — CLEAR",
    sort_order: 13,
  },
  {
    code: "no_open_food_packaging",
    label:
      "No sacks, cellophane bags, or open nylons of food found in luggage",
    sort_order: 14,
  },
] as const;

export function absoluteDocumentUrl(href: string, origin = "https://skyhostel.ng") {
  return `${origin}${href}`;
}
