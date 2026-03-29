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
    const role = searchParams.get("role") || "";
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (role) {
      filter.role = role;
    }

    const [users, total] = await Promise.all([
      db
        .collection("users")
        .find(filter)
        .project({
          password: 0,
          refreshToken: 0,
          refreshTokens: 0,
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection("users").countDocuments(filter),
    ]);

    return NextResponse.json({
      users: users.map((u: any) => ({ ...u, _id: u._id.toString() })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("Admin users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users", details: error.message },
      { status: 500 }
    );
  }
}
