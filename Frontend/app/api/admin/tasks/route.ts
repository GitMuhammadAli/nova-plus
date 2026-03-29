import { NextRequest, NextResponse } from "next/server";
import { hasValidAdminSession } from "@/app/lib/admin";
import { getAdminDb } from "@/app/lib/admin-db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const isAdmin = await hasValidAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getAdminDb();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") || "";
    const priority = searchParams.get("priority") || "";
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const [
      tasks,
      total,
      statusCounts,
      priorityCounts,
      overdueTasks,
    ] = await Promise.all([
      db
        .collection("tasks")
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection("tasks").countDocuments(filter),
      db
        .collection("tasks")
        .aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])
        .toArray(),
      db
        .collection("tasks")
        .aggregate([{ $group: { _id: "$priority", count: { $sum: 1 } } }])
        .toArray(),
      db
        .collection("tasks")
        .countDocuments({
          dueDate: { $lt: new Date() },
          status: { $nin: ["done", "completed", "cancelled"] },
        }),
    ]);

    const statusMap: Record<string, number> = {};
    statusCounts.forEach((s: any) => {
      if (s._id) statusMap[s._id] = s.count;
    });

    const priorityMap: Record<string, number> = {};
    priorityCounts.forEach((p: any) => {
      if (p._id) priorityMap[p._id] = p.count;
    });

    return NextResponse.json({
      tasks: tasks.map((t: any) => ({ ...t, _id: t._id.toString() })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      statusCounts: statusMap,
      priorityCounts: priorityMap,
      overdue: overdueTasks,
    });
  } catch (error: any) {
    console.error("Admin tasks error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks", details: error.message },
      { status: 500 }
    );
  }
}
