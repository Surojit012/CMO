import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, walletAddress, profile, plan } = body;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabaseServer
      .from("user_profiles")
      .upsert({
        user_id: userId,
        wallet_address: walletAddress || null,
        name: profile.name,
        email: profile.email,
        telegram: profile.telegram,
        twitter: profile.twitter || null,
        project_name: profile.projectName || null,
        plan: plan,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error("Supabase Error saving profile:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Onboarding API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
