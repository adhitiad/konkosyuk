export const ROOM_FACILITIES_PRESET = {
  kamar: [
    { name: "Kasur Single", icon: "bed-single" },
    { name: "Kasur Double", icon: "bed-double" },
    { name: "Kasur Queen", icon: "bed-double" },
    { name: "AC", icon: "ac" },
    { name: "Kipas Angin", icon: "fan" },
    { name: "Lemari Pakaian", icon: "archive" },
    { name: "Meja Belajar", icon: "lamp-desk" },
    { name: "Kursi", icon: "armchair" },
    { name: "Rak Buku", icon: "book-open" },
    { name: "Jendela", icon: "frame" },
    { name: "Gorden", icon: "blinds" },
  ],
  kamar_mandi: [
    { name: "Shower", icon: "shower-head" },
    { name: "Kloset Duduk", icon: "armchair" },
    { name: "Wastafel", icon: "sink" },
    { name: "Cermin", icon: "mirror" },
    { name: "Water Heater", icon: "flame" },
    { name: "Ember Shower", icon: "sparkles" },
  ],
  umum: [
    { name: "WiFi", icon: "wifi" },
    { name: "TV", icon: "tv" },
    { name: "Kulkas", icon: "refrigerator" },
    { name: "Parkir Motor", icon: "bike" },
    { name: "Parkir Mobil", icon: "car" },
    { name: "CCTV", icon: "cctv" },
    { name: "Laundry", icon: "shirt" },
    { name: "Dapur Bersama", icon: "cooking-pot" },
    { name: "Ruang Tamu", icon: "sofa" },
    { name: "Taman", icon: "trees" },
    { name: "Keamanan 24 Jam", icon: "shield-check" },
    { name: "Listrik Token", icon: "zap" },
  ],
} as const;

export type RoomFacilityCategory = keyof typeof ROOM_FACILITIES_PRESET;
export type RoomFacilityPreset =
  (typeof ROOM_FACILITIES_PRESET)[RoomFacilityCategory][number];
