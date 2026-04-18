import { NextRequest, NextResponse } from "next/server";
import { publishToDevTo } from "@/lib/publishers/devto";
import { publishToHashnode } from "@/lib/publishers/hashnode";

export async function POST(request: NextRequest) {
  try {
    const { platform, content, title, tags } = await request.json();

    if (!platform || !content) {
      return NextResponse.json({ error: "Platform and content are required" }, { status: 400 });
    }

    let url = "";

    switch (platform) {
      case "devto":
        url = await publishToDevTo(title || "AI Growth Report by CMO", content, tags);
        break;
      case "hashnode":
        url = await publishToHashnode(title || "AI Growth Report by CMO", content);
        break;
      default:
        return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
    }

    return NextResponse.json({ success: true, url });

  } catch (error) {
    console.error("Publishing error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
