import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  const body = await req.json();
  const brand = String(body.brand ?? "").trim();
  const name = String(body.name ?? "").trim();
  const category = body.category ? String(body.category).trim() : null;

  if (!brand || !name) return new NextResponse("brand and name are required", { status: 400 });

  // 1) brand upsert
  const { data: brandRow, error: bErr } = await supabase
    .from("brands")
    .upsert({ name: brand }, { onConflict: "name" })
    .select("id, name")
    .single();

  if (bErr) return new NextResponse(bErr.message, { status: 500 });

  // 2) item upsert (brand_id + name unique)
  const { data: itemRow, error: iErr } = await supabase
    .from("items")
    .upsert({ brand_id: brandRow.id, name, category }, { onConflict: "brand_id,name" })
    .select("id, name, category")
    .single();

  if (iErr) return new NextResponse(iErr.message, { status: 500 });

  // 3) return candidate-like shape
  const item = {
    id: itemRow.id,
    brand_name: brandRow.name,
    item_name: itemRow.name,
    category: itemRow.category,
  };

  return NextResponse.json({ item });
}
