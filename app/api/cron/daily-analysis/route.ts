import { NextRequest, NextResponse } from "next/server";
import { fetchWebsiteContent } from "@/lib/scraper";
import { runAllAgents } from "@/lib/agents";
import { aggregateAgentOutputs } from "@/lib/aggregator";
import { runCriticPass } from "@/lib/critic";
import { extractProductName } from "@/lib/ai";
import { getAutonomousUsers, setAnalysisReport, getTelegramChatId } from "@/lib/autonomous-storage";
import { sendTelegramAlert } from "@/lib/telegram";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // 1. Verify cron secret
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const enabledUsers = await getAutonomousUsers();

    console.log(`Cron: Running growth analysis for ${enabledUsers.length} users.`);

    // 3. Process each user
    const results = await Promise.all(
      enabledUsers.map(async (user) => {
        try {
          // A. Scrape website content
          const website = await fetchWebsiteContent(user.websiteUrl);

          // B. Extract product name for hallucination prevention
          const productName = extractProductName(website.visibleText, user.websiteUrl);
          console.log(`Cron running for: ${user.websiteUrl} | Product: ${productName}`);
          
          // C. Run full multi-agent growth pipeline
          const agentOutputs = await runAllAgents(website.visibleText);

          // D. Critic Pass — quality-check before aggregation
          const criticResult = await runCriticPass(agentOutputs, website.visibleText, productName, user.websiteUrl);
          console.log(`[Cron/Critic] Quality Score: ${criticResult.overall_quality_score}/10 for ${productName}`);

          // E. Aggregate with critic results + productName
          const markdown = await aggregateAgentOutputs(
            website.visibleText,
            agentOutputs,
            undefined,
            undefined,
            { isDaily: true },
            criticResult,
            productName
          );

          // F. Save results to in-memory storage
          const report = {
            output: markdown,
            timestamp: new Date().toISOString(),
            seen: false
          };
          await setAnalysisReport(user.userId, report);

          // G. Send Telegram Alert if user is connected
          try {
            const chatId = await getTelegramChatId(user.userId);
            if (chatId) {
              const quality = criticResult.overall_quality_score;
              const msg = `🚨 <b>Your daily CMO Growth Scan is ready.</b>\n\n<b>Domain:</b> ${user.websiteUrl}\n<b>Strategy Score:</b> ${quality}/10\n\nLogin to your dashboard to view the full report, implement the viral hooks, and generate your 8-week outreach plan.`;
              await sendTelegramAlert(chatId, msg);
            }
          } catch (telErr) {
            console.error(`Failed to send Telegram alert for ${user.websiteUrl}:`, telErr);
          }

          return { userId: user.userId, status: "success" };
        } catch (err: any) {
          console.error(`Cron: Failed for user ${user.userId}:`, err.message);
          return { userId: user.userId, status: "failed", error: err.message };
        }
      })
    );

    return NextResponse.json({
      ok: true,
      processed: results.length,
      details: results
    });
  } catch (error) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

