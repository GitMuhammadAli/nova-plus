"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const userFormSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  role: z
    .enum([
      "ADMIN",
      "MANAGER",
      "EDITOR",
      "USER",
      "VIEWER",
      "COMPANY_ADMIN",
      "SUPER_ADMIN",
    ])
    .default("USER"),
  status: z.enum(["active", "inactive", "pending"]).optional(),
  department: z
    .string()
    .min(2, "Department must be at least 2 characters")
    .optional(),
  location: z
    .string()
    .min(2, "Location must be at least 2 characters")
    .optional(),
  managerId: z.string().optional(),
  password: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 6, {
      message: "Password must be at least 6 characters",
    }),
  confirmPassword: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 6, {
      message: "Confirm password must be at least 6 characters",
    }),
});

type UserFormValues = z.infer<typeof userFormSchema>;

import { User } from "@/types/user";

interface ManagerOption {
  _id: string;
  name?: string;
  email?: string;
}

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSave: (data: UserFormValues & { _id?: string; managerId?: string }) => void;
  currentUserRole?: string;
  managers?: ManagerOption[];
  defaultRole?: "ADMIN" | "MANAGER" | "EDITOR" | "USER" | "VIEWER" | string;
}

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  onSave,
  currentUserRole,
  managers = [],
  defaultRole = "USER",
}: UserFormDialogProps) {
  const isAdmin =
    currentUserRole === "admin" ||
    currentUserRole === "superadmin" ||
    currentUserRole === "company_admin";
  const isManager = currentUserRole === "manager";

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      role: isManager ? "USER" : (defaultRole as any) ?? "USER",
      status: "active",
      department: "",
      location: "",
      managerId: "unassigned",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (user) {
      const managerIdValue =
        typeof user.managerId === "object"
          ? user.managerId?._id || user.managerId?.id || "unassigned"
          : (user.managerId as string) || "unassigned";

      form.reset({
        name: user.name || "",
        email: user.email,
        role: (user.role as any) || "USER",
        status: user.isActive === false ? "inactive" : "active",
        department: user.department || "",
        location: user.location || "",
        managerId: managerIdValue,
        password: "",
        confirmPassword: "",
      });
    } else {
      form.reset({
        name: "",
        email: "",
        role: (defaultRole as any) || "USER",
        status: "active",
        department: "",
        location: "",
        managerId: "unassigned",
        password: "",
        confirmPassword: "",
      });
    }
  }, [user, open, form, defaultRole]);

  const selectedRole = form.watch("role");

  // Generate a secure random password
  const generateSecurePassword = (): string => {
    const length = 12;
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    if (
      typeof window !== "undefined" &&
      window.crypto &&
      window.crypto.getRandomValues
    ) {
      const values = window.crypto.getRandomValues(new Uint32Array(length));
      password = Array.from(values, (x) => charset[x % charset.length]).join(
        ""
      );
    } else {
      // Fallback for older browsers
      for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
      }
    }
    return password;
  };

  const onSubmit = async (values: UserFormValues) => {
    // For new users, auto-generate password if not provided
    if (!user) {
      // Auto-generate secure password for new users
      if (!values.password) {
        values.password = generateSecurePassword();
        values.confirmPassword = values.password;
      } else if (values.password !== values.confirmPassword) {
        form.setError("confirmPassword", { message: "Passwords do not match" });
        return;
      }
    } else {
      // For editing users, only include password if provided
      if (!values.password) {
        delete values.password;
        delete values.confirmPassword;
      } else if (values.password !== values.confirmPassword) {
        form.setError("confirmPassword", { message: "Passwords do not match" });
        return;
      }
    }

    try {
      await onSave({
        ...values,
        _id: user?._id,
        managerId:
          values.managerId && values.managerId !== "unassigned"
            ? values.managerId
            : undefined,
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      // Error is handled in parent component
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>{user ? "Edit User" : "Add New User"}</DialogTitle>
          <DialogDescription>
            {user
              ? "Update user information below."
              : "Fill in the details to create a new user account."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 min-h-0"
          >
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@company.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                {/* Role field - only shown for Admin, Managers can only create Users */}
                {isAdmin && (
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="MANAGER">Manager</SelectItem>
                            <SelectItem value="USER">User</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {!isAdmin && (
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <FormControl>
                          <Input value="User" disabled className="bg-muted" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || "active"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {selectedRole === "USER" && (
                <FormField
                  control={form.control}
                  name="managerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign Manager</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(
                            value === "unassigned" ? undefined : value
                          )
                        }
                        value={field.value || "unassigned"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a manager" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {managers.map((manager) => (
                            <SelectItem key={manager._id} value={manager._id}>
                              {manager.name || manager.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                      <Input placeholder="Engineering" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="San Francisco, CA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password fields - only show for editing users (optional) */}
              {user && (
                <>
                  <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                    <p className="font-medium mb-1">
                      Change Password (Optional)
                    </p>
                    <p className="text-xs">
                      Leave blank to keep the current password. User will need
                      to change password on next login.
                    </p>
                  </div>
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Leave blank to keep current"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Leave blank to keep current"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* For new users, show info about auto-generated password */}
              {!user && (
                <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md border border-blue-200 dark:border-blue-800">
                  <p className="font-medium mb-1 text-blue-900 dark:text-blue-100">
                    🔒 Secure Password Generation
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    A secure random password will be automatically generated for
                    this user. They will receive an email invitation to set
                    their own password on first login.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter className="px-6 py-4 border-t bg-muted/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">{user ? "Update" : "Create"} User</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
