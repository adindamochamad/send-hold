export type PlanLine = {
  role: "Support" | "Dinner" | "Drink";
  name: string;
  /** Fixture only: marks which line is held when QLOO_API_KEY is unset. */
  held?: boolean;
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
  /** Shown when live evaluation is silent (negative-control folio). */
  negativeControlNote?: string;
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
      { role: "Dinner", name: "Joe Pizza", held: true },
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
      { role: "Drink", name: "Mammee Noodle Snack", held: true },
    ],
  },
  {
    id: "late",
    label: "Late Set",
    day: "Saturday",
    city: "Los Angeles",
    headliner: "zzznomatch999xyz",
    silent: true,
    negativeControlNote:
      "Negative control: this headliner string does not resolve in Qloo search, so the plan stays silent and nothing sends.",
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
