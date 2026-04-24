import { NextResponse } from "next/server";
import { consumeTelegramLinkToken, setTelegramChatId } from "@/lib/autonomous-storage";
import { sendTelegramAlert } from "@/lib/telegram";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    if (data.message && data.message.text) {
      const text = data.message.text.trim();
      const chatId = data.message.chat.id;

      if (text.startsWith("/start ")) {
        const parts = text.split(" ");
        if (parts.length === 2) {
          const token = parts[1];
          const userId = await consumeTelegramLinkToken(token);

          if (!userId) {
            await sendTelegramAlert(
              chatId.toString(),
              "<b>Link expired.</b> Open CMO and tap Connect Telegram again to generate a fresh secure link."
            );
            return NextResponse.json({ ok: true });
          }

          await setTelegramChatId(userId, chatId);

          await sendTelegramAlert(
            chatId.toString(),
            `<b>✅ Successfully connected to CMO!</b>

Your account is now linked. You will receive real-time alerts here whenever your autonomous growth analysis completes.`
          );

          return NextResponse.json({ ok: true });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram Webhook Error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
