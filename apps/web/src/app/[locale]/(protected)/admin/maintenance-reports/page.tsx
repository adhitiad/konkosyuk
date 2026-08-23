"use client";

import { withAdminAuth } from "@/lib/with-admin-auth";
import OwnerReportList from "@/components/reports/owner-report-list";

function AdminMaintenanceReportsPage() {
  return (
    <div className="container py-6">
      <OwnerReportList />
    </div>
  );
}

export default withAdminAuth(AdminMaintenanceReportsPage);
