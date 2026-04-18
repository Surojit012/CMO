import { NextResponse } from "next/server";
import { setTelegramChatId } from "@/lib/autonomous-storage";
import { sendTelegramAlert } from "@/lib/telegram";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    if (data.message && data.message.text) {
      const text = data.message.text.trim();
      const chatId = data.message.chat.id;

      // Expect format: /start <userId>
      if (text.startsWith("/start ")) {
        const parts = text.split(" ");
        if (parts.length === 2) {
          const userId = parts[1];
          
          await setTelegramChatId(userId, chatId);

          await sendTelegramAlert(
            chatId.toString(),
            `<b>✅ Successfully connected to CMO!</b>\n\nYour account is now linked. You will receive real-time alerts here whenever your autonomous growth analysis completes.`
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
