import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  // v_items_with_brand を使う（brand + item 名で簡易検索）
  let query = supabase.from("v_items_with_brand").select("id, brand_name, item_name, category, created_at").order("created_at", { ascending: false }).limit(30);

  if (q) {
    // ilike でざっくり検索（軽量MVP）
    query = query.or(`brand_name.ilike.%${q}%,item_name.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) return new NextResponse(error.message, { status: 500 });

  return NextResponse.json({ items: data ?? [] });
}
