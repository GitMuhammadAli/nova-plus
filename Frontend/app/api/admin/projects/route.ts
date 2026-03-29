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
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }
    if (status) {
      filter.status = status;
    }

    const [projects, total, statusCounts] = await Promise.all([
      db
        .collection("projects")
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection("projects").countDocuments(filter),
      db
        .collection("projects")
        .aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])
        .toArray(),
    ]);

    // Enrich with task counts
    const enriched = await Promise.all(
      projects.map(async (p: any) => {
        const tasksCount = await db
          .collection("tasks")
          .countDocuments({ projectId: p._id.toString() })
          .catch(() =>
            db
              .collection("tasks")
              .countDocuments({ project: p._id })
              .catch(() => 0)
          );
        return {
          ...p,
          _id: p._id.toString(),
          tasksCount,
        };
      })
    );

    const statusMap: Record<string, number> = {};
    statusCounts.forEach((s: any) => {
      if (s._id) statusMap[s._id] = s.count;
    });

    return NextResponse.json({
      projects: enriched,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      statusCounts: statusMap,
    });
  } catch (error: any) {
    console.error("Admin projects error:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects", details: error.message },
      { status: 500 }
    );
  }
}
