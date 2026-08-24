export const ROLE_OPTIONS = [
    { value: "cust", label: "Customer" },
    { value: "owner", label: "Owner" },
    { value: "staff", label: "Staff" },
    { value: "admin", label: "Admin" },
];
export function getRoleBadgeVariant(role) {
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
