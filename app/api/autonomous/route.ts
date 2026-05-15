import { NextRequest, NextResponse } from "next/server";
import {
  createTelegramLinkToken,
  deleteAutonomousUser,
  getAnalysisReport,
  getAutonomousUser,
  getTelegramChatId,
  setAnalysisReport,
  setAutonomousUser
} from "@/lib/autonomous-storage";
import type { AnalysisReport } from "@/lib/autonomous-storage";
import { getPrivyUserIdFromRequest } from "@/lib/privy-auth";

export async function POST(request: NextRequest) {
  try {
    const authenticatedUserId = await getPrivyUserIdFromRequest(request);

    if (!authenticatedUserId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { websiteUrl, enabled } = await request.json();

    if (!websiteUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (enabled) {
      await setAutonomousUser({ userId: authenticatedUserId, websiteUrl, enabled: true });
    } else {
      await deleteAutonomousUser(authenticatedUserId);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Autonomous POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authenticatedUserId = await getPrivyUserIdFromRequest(request);

    if (!authenticatedUserId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const userState = await getAutonomousUser(authenticatedUserId);
    const report = await getAnalysisReport(authenticatedUserId);
    const telegramChatId = await getTelegramChatId(authenticatedUserId);
    const telegramConnectToken = await createTelegramLinkToken(authenticatedUserId);

    return NextResponse.json({
      enabled: userState?.enabled || false,
      activeUrl: userState?.websiteUrl || "",
      hasTelegram: !!telegramChatId,
      hasNewReport: report ? !report.seen : false,
      timestamp: report ? report.timestamp : "",
      output: report ? report.output : "",
      telegramConnectToken
    });
  } catch (error) {
    console.error("Autonomous GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authenticatedUserId = await getPrivyUserIdFromRequest(request);

    if (!authenticatedUserId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const report = await getAnalysisReport(authenticatedUserId);
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const updatedReport: AnalysisReport = { ...report, seen: true };
    await setAnalysisReport(authenticatedUserId, updatedReport);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Autonomous PATCH error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
