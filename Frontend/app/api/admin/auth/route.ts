import { NextRequest, NextResponse } from "next/server";
import {
  validateCredentials,
  createAdminSession,
  destroyAdminSession,
} from "@/app/lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const valid = validateCredentials(username, password);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    await createAdminSession(username);

    return NextResponse.json({ success: true, user: username });
  } catch (error: any) {
    console.error("Admin auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await destroyAdminSession();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Admin logout error:", error);
    return NextResponse.json(
      { error: "Logout failed" },
      { status: 500 }
    );
  }
}
