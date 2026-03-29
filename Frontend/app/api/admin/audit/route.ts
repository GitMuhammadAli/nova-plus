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
    const limit = parseInt(searchParams.get("limit") || "30");
    const action = searchParams.get("action") || "";
    const resource = searchParams.get("resource") || "";
    const userId = searchParams.get("userId") || "";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (action) filter.action = action;
    if (resource) {
      filter.$or = [
        { resource: resource },
        { resourceType: resource },
      ];
    }
    if (userId) {
      filter.$or = [
        ...(filter.$or || []),
        { userId: userId },
        { "user.id": userId },
      ];
    }
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Try auditlogs collection first, then audit_logs
    let collectionName = "auditlogs";
    let testCount = await db.collection(collectionName).countDocuments({}).catch(() => -1);
    if (testCount === -1) {
      collectionName = "audit_logs";
      testCount = await db.collection(collectionName).countDocuments({}).catch(() => 0);
    }

    const [logs, total] = await Promise.all([
      db
        .collection(collectionName)
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection(collectionName).countDocuments(filter),
    ]);

    return NextResponse.json({
      logs: logs.map((l: any) => ({ ...l, _id: l._id.toString() })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("Admin audit error:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs", details: error.message },
      { status: 500 }
    );
  }
}
