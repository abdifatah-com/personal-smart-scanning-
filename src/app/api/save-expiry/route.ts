import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const barcode = body?.barcode as string | undefined;
  const expiry_date = body?.expiry_date as string | undefined;
  if (!barcode || !expiry_date) {
    return new Response(JSON.stringify({ error: "barcode and expiry_date required" }), { status: 400 });
  }

  const is_expired = new Date(expiry_date) < new Date();
  const { data, error } = await supabase
    .from("scans")
    .upsert({ barcode, expiry_date, is_expired }, { onConflict: "barcode" })
    .select()
    .limit(1)
    .maybeSingle();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  return new Response(JSON.stringify({ ok: true, data }), { status: 200 });
}
