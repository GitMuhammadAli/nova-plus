import { NextResponse } from "next/server";
import { hasValidAdminSession } from "@/app/lib/admin";
import { getAdminDb, getAdminClient } from "@/app/lib/admin-db";

export const dynamic = "force-dynamic";

export async function GET() {
  const isAdmin = await hasValidAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // MongoDB health
    let mongoStatus = "disconnected";
    let mongoDetails: any = null;
    try {
      const client = await getAdminClient();
      const adminDb = client.db("admin");
      const serverStatus = await adminDb.command({ serverStatus: 1 }).catch(() => null);
      mongoStatus = "connected";
      mongoDetails = serverStatus
        ? {
            version: serverStatus.version,
            uptime: serverStatus.uptime,
            connections: serverStatus.connections,
          }
        : { version: "unknown" };
    } catch (e: any) {
      mongoStatus = "error";
      mongoDetails = { error: e.message };
    }

    // Redis health (via backend health endpoint)
    let redisStatus = "unknown";
    let backendStatus = "unreachable";
    let backendHealth: any = null;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5500";
    try {
      const res = await fetch(`${apiUrl}/api/v1/health`, {
        signal: AbortSignal.timeout(5000),
      });
      backendHealth = await res.json();
      backendStatus = res.ok ? "healthy" : "degraded";
      redisStatus = backendHealth?.redis || backendHealth?.data?.redis || "unknown";
    } catch {
      backendStatus = "unreachable";
    }

    // Memory usage
    const mem = process.memoryUsage();

    // Database stats
    let dbStats: any = null;
    try {
      const db = await getAdminDb();
      dbStats = await db.command({ dbStats: 1 });
    } catch {
      dbStats = null;
    }

    // Environment config status
    const envConfig = {
      ADMIN_USERNAME: !!process.env.ADMIN_USERNAME,
      ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD || !!process.env.ADMIN_PASSWORD_HASH,
      ADMIN_EMAILS: !!process.env.ADMIN_EMAILS,
      MONGO_URI: !!process.env.MONGO_URI,
      JWT_SECRET: !!process.env.JWT_SECRET || !!process.env.ADMIN_SECRET,
      NEXT_PUBLIC_API_URL: !!process.env.NEXT_PUBLIC_API_URL,
      NODE_ENV: process.env.NODE_ENV || "development",
    };

    return NextResponse.json({
      mongodb: {
        status: mongoStatus,
        details: mongoDetails,
        dbStats: dbStats
          ? {
              collections: dbStats.collections,
              dataSize: Math.round((dbStats.dataSize || 0) / 1024 / 1024),
              storageSize: Math.round((dbStats.storageSize || 0) / 1024 / 1024),
              indexes: dbStats.indexes,
              indexSize: Math.round((dbStats.indexSize || 0) / 1024 / 1024),
            }
          : null,
      },
      redis: {
        status: redisStatus,
      },
      backend: {
        status: backendStatus,
        url: apiUrl,
        health: backendHealth,
      },
      memory: {
        rss: Math.round(mem.rss / 1024 / 1024),
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
        external: Math.round(mem.external / 1024 / 1024),
      },
      environment: envConfig,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Admin system health error:", error);
    return NextResponse.json(
      { error: "Failed to check system health", details: error.message },
      { status: 500 }
    );
  }
}
