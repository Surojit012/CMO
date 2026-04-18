import { NextRequest, NextResponse } from "next/server";
import { getAnalysisReport, setAnalysisReport, getAutonomousUsers, getAutonomousUser, setAutonomousUser, deleteAutonomousUser, getTelegramChatId } from "@/lib/autonomous-storage";
import type { AnalysisReport, AutonomousUser } from "@/lib/autonomous-storage";

export async function POST(request: NextRequest) {
  try {
    const { userId, websiteUrl, enabled } = await request.json();

    if (!userId || !websiteUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (enabled) {
      await setAutonomousUser({ userId, websiteUrl, enabled });
    } else {
      await deleteAutonomousUser(userId);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Autonomous POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      // If no userId, return all enabled users
      const enabledUsers = await getAutonomousUsers();
      return NextResponse.json({ users: enabledUsers.filter((u) => u.enabled) });
    }

    const userState = await getAutonomousUser(userId);
    const report = await getAnalysisReport(userId);
    const telegramChatId = await getTelegramChatId(userId);

    return NextResponse.json({
      enabled: userState?.enabled || false,
      hasTelegram: !!telegramChatId,
      hasNewReport: report ? !report.seen : false,
      timestamp: report ? report.timestamp : "",
      output: report ? report.output : ""
    });
  } catch (error) {
    console.error("Autonomous GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const report = await getAnalysisReport(userId);
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const updatedReport: AnalysisReport = { ...report, seen: true };
    await setAnalysisReport(userId, updatedReport);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Autonomous PATCH error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
