export const ROLE_OPTIONS = [
  { value: "cust", label: "Customer" },
  { value: "owner", label: "Owner" },
  { value: "staff", label: "Staff" },
  { value: "admin", label: "Admin" },
] as const;

export type RoleOption = (typeof ROLE_OPTIONS)[number];

export function getRoleBadgeVariant(
  role: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (role) {
    case "admin":
      return "destructive";
    case "staff":
      return "secondary";
    case "owner":
      return "default";
    default:
      return "outline";
  }
}
