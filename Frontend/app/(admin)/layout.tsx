import { redirect } from "next/navigation";
import { hasValidAdminSession } from "@/app/lib/admin-auth";
import { AdminSidebar } from "./AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isValid = await hasValidAdminSession();
  if (!isValid) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-[#0a0a12] text-gray-100">
      <AdminSidebar>{children}</AdminSidebar>
    </div>
  );
}
