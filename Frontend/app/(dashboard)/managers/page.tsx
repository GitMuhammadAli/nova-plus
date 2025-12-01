import { requireRole } from "@/lib/auth-server";
import { serverAPI } from "@/lib/server-api";
import { RoleGuard } from "@/components/guards/RoleGuard";
import { ManagersClient } from "./ManagersClient";

export default async function ManagersPage() {
  // Server-side: Fetch data and check auth
  const user = await requireRole(['company_admin', 'admin']);
  
  // Fetch users data on server
  let users: any[] = [];
  let managers: any[] = [];
  
  try {
    users = await serverAPI.getCompanyUsers({ limit: 1000 });
    if (!Array.isArray(users)) {
      users = users?.data || [];
    }
    managers = users.filter((user) => (user.role || "").toLowerCase() === "manager");
  } catch (error) {
    console.error('Failed to fetch managers:', error);
    // Continue with empty arrays - client will handle loading state
  }

  return (
    <RoleGuard allowedRoles={['company_admin', 'admin']}>
      <ManagersClient initialManagers={managers} initialUsers={users} />
    </RoleGuard>
  );
}
