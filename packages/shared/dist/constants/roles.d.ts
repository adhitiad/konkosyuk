export declare const ROLE_OPTIONS: readonly [{
    readonly value: "cust";
    readonly label: "Customer";
}, {
    readonly value: "owner";
    readonly label: "Owner";
}, {
    readonly value: "staff";
    readonly label: "Staff";
}, {
    readonly value: "admin";
    readonly label: "Admin";
}];
export type RoleOption = (typeof ROLE_OPTIONS)[number];
export declare function getRoleBadgeVariant(role: string): "default" | "secondary" | "destructive" | "outline";
//# sourceMappingURL=roles.d.ts.map