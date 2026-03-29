import { redirect } from "next/navigation";
import { hasValidAdminSession, getAdminSessionUser } from "./admin-auth";

/**
 * Require a valid admin session. If not authenticated, redirect to login.
 * Use in Server Components and route handlers that need admin protection.
 */
export async function requireAdmin(): Promise<string> {
  const user = await getAdminSessionUser();
  if (!user) {
    redirect("/admin/login");
  }
  return user;
}

/**
 * Check if an email is in the ADMIN_EMAILS list.
 */
export function isAdminEmail(email: string): boolean {
  const adminEmails = process.env.ADMIN_EMAILS || "";
  const emails = adminEmails.split(",").map((e) => e.trim().toLowerCase());
  return emails.includes(email.toLowerCase());
}

export { hasValidAdminSession, getAdminSessionUser };
