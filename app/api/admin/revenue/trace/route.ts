// GET /api/admin/revenue/trace?sub_id=live_test_123
//
// End-to-End Revenue Tracer — POSTLIVE-00.2
// Used for Go-Live validation to trace a specific sub_id's click and postback status.

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { traceSubIdLifecycle } from "@/lib/revenue-data";

export async function GET(req: NextRequest) {
  if (!(await getAdminUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const subId = req.nextUrl.searchParams.get("sub_id");
    if (!subId) {
      return NextResponse.json(
        { error: "sub_id parameter is required for tracing" },
        { status: 400 },
      );
    }

    const traceResult = await traceSubIdLifecycle(subId);
    return NextResponse.json(traceResult);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
