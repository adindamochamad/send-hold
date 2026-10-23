export type PlanLine = {
  role: "Support" | "Dinner" | "Drink";
  name: string;
  held?: boolean;
  replacement?: string;
  /** Override Qloo entity type for search/insights (demo folios only). */
  searchEntityType?: string;
};

export type Plan = {
  id: string;
  label: string;
  day: string;
  city: string;
  headliner: string;
  lines: PlanLine[];
  /** Fixture only: Qloo does not answer for this folio. */
  silent?: boolean;
};

export const plans: Plan[] = [
  {
    id: "north-wharf",
    label: "North Wharf",
    day: "Thursday",
    city: "New York",
    headliner: "Taylor Swift",
    lines: [
      { role: "Support", name: "Carly Rae Jepsen" },
      {
        role: "Dinner",
        name: "Joe Pizza",
        held: true,
        replacement: "Orchard Stair",
      },
      { role: "Drink", name: "Keds" },
    ],
  },
  {
    id: "canal",
    label: "Canal Room",
    day: "Friday",
    city: "London",
    headliner: "Beyoncé",
    lines: [
      { role: "Support", name: "Demi Lovato" },
      { role: "Dinner", name: "Park Güell" },
      {
        role: "Drink",
        name: "Joe Pizza",
        held: true,
        replacement: "House Verrine",
        searchEntityType: "urn:entity:place",
      },
    ],
  },
  {
    id: "late",
    label: "Late Set",
    day: "Saturday",
    city: "Los Angeles",
    headliner: "zzznomatch999xyz",
    silent: true,
    lines: [
      { role: "Support", name: "Gold Window" },
      { role: "Dinner", name: "Patio Twelve" },
      { role: "Drink", name: "Dry Lantern" },
    ],
  },
  {
    id: "open-door",
    label: "Open Door",
    day: "Sunday",
    city: "Chicago",
    headliner: "Taylor Swift",
    lines: [
      { role: "Support", name: "Carly Rae Jepsen" },
      { role: "Dinner", name: "Park Güell" },
      { role: "Drink", name: "Keds" },
    ],
  },
];

export type SheetStatus = "held" | "silent" | "cleared";
