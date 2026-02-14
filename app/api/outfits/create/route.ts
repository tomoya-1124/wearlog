import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { makeShareId } from "@/lib/shareId";

export async function POST(req: Request) {
  const body = await req.json();

  const date = String(body.date ?? "").trim();
  const memo = body.memo ? String(body.memo) : null;
  const tags = body.tags ? String(body.tags) : null;
  const imageUrl = body.imageUrl ? String(body.imageUrl) : null;
  const publicFlg = Boolean(body.publicFlg);
  const itemIds: string[] = Array.isArray(body.itemIds) ? body.itemIds : [];

  if (!date) return new NextResponse("date is required", { status: 400 });

  // share_id 生成（衝突したら再生成）
  let shareId = makeShareId();

  // insert outfit
  const { data: outfit, error: oErr } = await supabase
    .from("outfits")
    .insert({
      date,
      memo,
      tags,
      image_url: imageUrl,
      public_flg: publicFlg,
      share_id: shareId,
    })
    .select("id, share_id")
    .single();

  if (oErr) {
    // share_id衝突の可能性を雑に救済
    if (oErr.message.includes("duplicate key value")) {
      shareId = makeShareId();
      const retry = await supabase
        .from("outfits")
        .insert({ date, memo, tags, image_url: imageUrl, public_flg: publicFlg, share_id: shareId })
        .select("id, share_id")
        .single();
      if (retry.error) return new NextResponse(retry.error.message, { status: 500 });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const o2 = retry.data!;
      // 続行のため outfit変数っぽく扱う
      // ここから下を共通化したいけどMVPなので省略
      // outfit_items insert
      if (itemIds.length) {
        const rows = itemIds.map((id) => ({ outfit_id: o2.id, item_id: id }));
        const oi = await supabase.from("outfit_items").insert(rows);
        if (oi.error) return new NextResponse(oi.error.message, { status: 500 });
      }
      return NextResponse.json({ ok: true, outfitId: o2.id, shareId: o2.share_id });
    }
    return new NextResponse(oErr.message, { status: 500 });
  }

  // outfit_items insert
  if (itemIds.length) {
    const rows = itemIds.map((id) => ({ outfit_id: outfit.id, item_id: id }));
    const { error: oiErr } = await supabase.from("outfit_items").insert(rows);
    if (oiErr) return new NextResponse(oiErr.message, { status: 500 });
  }

  return NextResponse.json({ ok: true, outfitId: outfit.id, shareId: outfit.share_id });
}
