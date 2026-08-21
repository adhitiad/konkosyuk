export type FilterChip = {
  value: string | undefined;
  labelKey: string;
};

export const TYPE_CHIPS: FilterChip[] = [
  { value: undefined, labelKey: "allType" },
  { value: "kost", labelKey: "kost" },
  { value: "kontrakan", labelKey: "kontrakan" },
  { value: "ruko", labelKey: "ruko" },
];

export const DURATION_CHIPS: FilterChip[] = [
  { value: undefined, labelKey: "allDuration" },
  { value: "harian", labelKey: "harian" },
  { value: "bulanan", labelKey: "bulanan" },
  { value: "tahunan", labelKey: "tahunan" },
];

export const GENDER_CHIPS: FilterChip[] = [
  { value: undefined, labelKey: "allGender" },
  { value: "putra", labelKey: "putra" },
  { value: "putri", labelKey: "putri" },
  { value: "campuran", labelKey: "campuran" },
];

export const AMENITY_CHIPS: FilterChip[] = [
  { value: "wifi", labelKey: "wifi" },
  { value: "ac", labelKey: "ac" },
  { value: "parkir", labelKey: "parkir" },
  { value: "dapur", labelKey: "dapur" },
  { value: "laundry", labelKey: "laundry" },
  { value: "balkon", labelKey: "balkon" },
  { value: "keamanan-24jam", labelKey: "security24h" },
];
