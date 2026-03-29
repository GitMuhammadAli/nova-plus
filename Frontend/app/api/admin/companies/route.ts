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
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { domain: { $regex: search, $options: "i" } },
      ];
    }

    const [companies, total] = await Promise.all([
      db
        .collection("companies")
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection("companies").countDocuments(filter),
    ]);

    // Enrich with user and project counts
    const enriched = await Promise.all(
      companies.map(async (c: any) => {
        const [usersCount, projectsCount] = await Promise.all([
          db.collection("users").countDocuments({ companyId: c._id.toString() })
            .catch(() => db.collection("users").countDocuments({ company: c._id }))
            .catch(() => 0),
          db.collection("projects").countDocuments({ companyId: c._id.toString() })
            .catch(() => db.collection("projects").countDocuments({ company: c._id }))
            .catch(() => 0),
        ]);
        return {
          ...c,
          _id: c._id.toString(),
          usersCount,
          projectsCount,
        };
      })
    );

    return NextResponse.json({
      companies: enriched,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("Admin companies error:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies", details: error.message },
      { status: 500 }
    );
  }
}
