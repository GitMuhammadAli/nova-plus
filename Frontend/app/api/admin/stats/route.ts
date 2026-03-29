import { NextResponse } from "next/server";
import { hasValidAdminSession } from "@/app/lib/admin";
import { getAdminDb } from "@/app/lib/admin-db";

export const dynamic = "force-dynamic";

export async function GET() {
  const isAdmin = await hasValidAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getAdminDb();

    // Run all queries in parallel
    const [
      totalUsers,
      usersByRole,
      activeUsers7d,
      suspendedUsers,
      totalCompanies,
      activeCompanies,
      companiesWithBilling,
      totalProjects,
      projectsByStatus,
      totalTasks,
      tasksByStatus,
      tasksByPriority,
      recentAuditLogs,
      recentActiveUsers,
    ] = await Promise.all([
      // User metrics
      db.collection("users").countDocuments(),
      db.collection("users").aggregate([
        { $group: { _id: "$role", count: { $sum: 1 } } },
      ]).toArray(),
      db.collection("users").countDocuments({
        lastActiveAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
      db.collection("users").countDocuments({
        $or: [{ suspended: true }, { isSuspended: true }, { status: "suspended" }],
      }),

      // Company metrics
      db.collection("companies").countDocuments(),
      db.collection("companies").countDocuments({
        $or: [{ isActive: true }, { status: "active" }],
      }),
      db.collection("companies").countDocuments({
        $or: [
          { "billing.status": { $exists: true } },
          { billingStatus: { $exists: true } },
          { stripeCustomerId: { $exists: true } },
        ],
      }),

      // Project metrics
      db.collection("projects").countDocuments(),
      db.collection("projects").aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]).toArray(),

      // Task metrics
      db.collection("tasks").countDocuments(),
      db.collection("tasks").aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]).toArray(),
      db.collection("tasks").aggregate([
        { $group: { _id: "$priority", count: { $sum: 1 } } },
      ]).toArray(),

      // Recent audit logs
      db.collection("auditlogs")
        .find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray()
        .catch(() =>
          db.collection("audit_logs")
            .find({})
            .sort({ createdAt: -1 })
            .limit(10)
            .toArray()
            .catch(() => [])
        ),

      // Recently active users
      db.collection("users")
        .find({})
        .sort({ lastActiveAt: -1 })
        .limit(10)
        .project({ name: 1, email: 1, role: 1, lastActiveAt: 1, avatar: 1 })
        .toArray(),
    ]);

    // System health checks
    let mongoStatus = "connected";
    let redisStatus = "unknown";
    let backendHealth: any = null;

    // Check backend health
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5500";
      const healthRes = await fetch(`${apiUrl}/api/v1/health`, {
        signal: AbortSignal.timeout(3000),
      });
      backendHealth = await healthRes.json();
      redisStatus = backendHealth?.redis || backendHealth?.data?.redis || "unknown";
    } catch {
      backendHealth = null;
    }

    // Memory usage
    const memUsage = process.memoryUsage();

    // Format role counts into an object
    const roleMap: Record<string, number> = {};
    usersByRole.forEach((r: any) => {
      if (r._id) roleMap[r._id] = r.count;
    });

    // Format project status counts
    const projectStatusMap: Record<string, number> = {};
    projectsByStatus.forEach((p: any) => {
      if (p._id) projectStatusMap[p._id] = p.count;
    });

    // Format task status counts
    const taskStatusMap: Record<string, number> = {};
    tasksByStatus.forEach((t: any) => {
      if (t._id) taskStatusMap[t._id] = t.count;
    });

    // Format task priority counts
    const taskPriorityMap: Record<string, number> = {};
    tasksByPriority.forEach((t: any) => {
      if (t._id) taskPriorityMap[t._id] = t.count;
    });

    return NextResponse.json({
      users: {
        total: totalUsers,
        byRole: roleMap,
        activeLastWeek: activeUsers7d,
        suspended: suspendedUsers,
      },
      companies: {
        total: totalCompanies,
        active: activeCompanies,
        withBilling: companiesWithBilling,
      },
      projects: {
        total: totalProjects,
        byStatus: projectStatusMap,
      },
      tasks: {
        total: totalTasks,
        byStatus: taskStatusMap,
        byPriority: taskPriorityMap,
      },
      system: {
        mongodb: mongoStatus,
        redis: redisStatus,
        memory: {
          rss: Math.round(memUsage.rss / 1024 / 1024),
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        },
        backend: backendHealth ? "healthy" : "unreachable",
      },
      recentAuditLogs: recentAuditLogs.map((log: any) => ({
        ...log,
        _id: log._id?.toString(),
      })),
      recentActiveUsers: recentActiveUsers.map((u: any) => ({
        ...u,
        _id: u._id?.toString(),
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats", details: error.message },
      { status: 500 }
    );
  }
}
