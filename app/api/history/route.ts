import { NextRequest, NextResponse } from "next/server";
import { getPrivyUserIdFromRequest } from "@/lib/privy-auth";
import { supabaseServer } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userId = getPrivyUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ savedReports: [] }); // Gracefully return empty if not set up
    }

    const { data: savedReports, error } = await supabaseServer
      .from("saved_reports")
      .select("id, session_id, url, type, data, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50); // Get latest 50

    if (error) {
      console.error("Supabase fetch error [history]:", error);
      throw new Error("Failed to fetch history");
    }

    return NextResponse.json({ savedReports: savedReports || [] });
  } catch (error) {
    console.error("History fetch error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while fetching history." },
      { status: 500 }
    );
  }
}
