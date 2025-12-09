import { requireAuth } from "@/lib/auth-server";
import { serverAPI } from "@/lib/server-api";
import { AppShell } from "@/components/layout/AppShell";
import { DepartmentsClient } from "./DepartmentsClient";

export default async function DepartmentsPage() {
  // Server-side: Fetch data and check auth
  const user = await requireAuth();

  // Fetch departments and users data on server
  let departments: any[] = [];
  let users: any[] = [];

  try {
    departments = await serverAPI.getDepartments();
    if (!Array.isArray(departments)) {
      departments = departments?.data || [];
    }

    users = await serverAPI.getCompanyUsers({ limit: 1000 });
    if (!Array.isArray(users)) {
      users = users?.data || [];
    }
  } catch (error) {
    // Silently handle error - show empty state
    // Continue with empty arrays - client will handle loading state
  }

  return (
    <AppShell>
      <DepartmentsClient
        initialDepartments={departments}
        initialUsers={users}
      />
    </AppShell>
  );
}
