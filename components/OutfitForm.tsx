"use client";

import { useState } from "react";
import ItemPicker, { PickedItem } from "./ItemPicker";
import { supabase } from "@/lib/supabaseClient";

export default function OutfitForm() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [memo, setMemo] = useState("");
  const [tags, setTags] = useState("");
  const [picked, setPicked] = useState<PickedItem[]>([]);
  const [publicFlg, setPublicFlg] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function uploadImageIfNeeded(): Promise<string | null> {
    if (!file) return null;
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage.from("outfit-images").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw error;

    const { data } = supabase.storage.from("outfit-images").getPublicUrl(path);
    return data.publicUrl;
  }

  async function onSubmit() {
    setBusy(true);
    setMsg(null);
    try {
      const imageUrl = await uploadImageIfNeeded();

      const res = await fetch("/api/outfits/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          memo,
          tags,
          publicFlg,
          imageUrl,
          itemIds: picked.map((p) => p.id),
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      setMsg("保存しました。トップに戻って確認してね。");
      setMemo("");
      setTags("");
      setPicked([]);
      setFile(null);
    } catch (e: any) {
      setMsg(e?.message ?? "エラー");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
      <label>
        日付
        <input value={date} onChange={(e) => setDate(e.target.value)} type="date" style={{ width: "100%" }} />
      </label>

      <label>
        ひとこと
        <textarea value={memo} onChange={(e) => setMemo(e.target.value)} style={{ width: "100%", minHeight: 80 }} />
      </label>

      <label>
        タグ（例: work,black,c0s）
        <input value={tags} onChange={(e) => setTags(e.target.value)} style={{ width: "100%" }} />
      </label>

      <label>
        画像（1枚）
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </label>

      <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="checkbox" checked={publicFlg} onChange={(e) => setPublicFlg(e.target.checked)} />
        共有リンクをON（/s/〜で閲覧可能）
      </label>

      <ItemPicker picked={picked} onChange={setPicked} />

      <button onClick={onSubmit} disabled={busy} style={{ padding: 12, borderRadius: 10 }}>
        {busy ? "保存中..." : "保存"}
      </button>

      {msg && <p style={{ whiteSpace: "pre-wrap" }}>{msg}</p>}
    </div>
  );
}
