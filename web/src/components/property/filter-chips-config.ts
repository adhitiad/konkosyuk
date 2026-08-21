export const TYPE_CHIPS = [
  { value: undefined, label: "Semua Tipe" },
  { value: "kost", label: "Kost" },
  { value: "kontrakan", label: "Kontrakan" },
  { value: "ruko", label: "Ruko" },
] as const;

export const DURATION_CHIPS = [
  { value: undefined, label: "Semua Durasi" },
  { value: "harian", label: "Harian" },
  { value: "bulanan", label: "Bulanan" },
  { value: "tahunan", label: "Tahunan" },
] as const;

export const GENDER_CHIPS = [
  { value: undefined, label: "Semua" },
  { value: "putra", label: "Putra" },
  { value: "putri", label: "Putri" },
  { value: "campuran", label: "Campuran" },
] as const;

export const AMENITY_CHIPS = [
  { value: "wifi", label: "WiFi" },
  { value: "ac", label: "AC" },
  { value: "parkir", label: "Parkir" },
  { value: "dapur", label: "Dapur" },
  { value: "laundry", label: "Laundry" },
  { value: "balkon", label: "Balkon" },
  { value: "keamanan-24jam", label: "24 Jam" },
] as const;
