import { NextRequest, NextResponse } from "next/server";
import { hasValidAdminSession } from "@/app/lib/admin";
import { getAdminDb } from "@/app/lib/admin-db";
import { ObjectId } from "mongodb";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await hasValidAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const db = await getAdminDb();
    const body = await request.json();

    const updateFields: any = {};
    if (body.role) updateFields.role = body.role;
    if (typeof body.suspended === "boolean") {
      updateFields.isSuspended = body.suspended;
      updateFields.suspended = body.suspended;
      if (body.suspended) {
        updateFields.status = "suspended";
      } else {
        updateFields.status = "active";
      }
    }
    if (typeof body.isActive === "boolean") {
      updateFields.isActive = body.isActive;
    }

    updateFields.updatedAt = new Date();

    const result = await db.collection("users").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateFields },
      { returnDocument: "after", projection: { password: 0, refreshToken: 0 } }
    );

    if (!result) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: { ...result, _id: result._id.toString() },
    });
  } catch (error: any) {
    console.error("Admin user update error:", error);
    return NextResponse.json(
      { error: "Failed to update user", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await hasValidAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const db = await getAdminDb();

    const result = await db
      .collection("users")
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Admin user delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete user", details: error.message },
      { status: 500 }
    );
  }
}
