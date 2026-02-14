"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type OutfitRow = {
  id: string;
  created_at: string;
  date: string;
  brand: string;
  item_name: string;
  memo: string | null;
  image_path: string | null;
};

export default function OutfitForm() {
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [brand, setBrand] = useState("");
  const [itemName, setItemName] = useState("");
  const [memo, setMemo] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return brand.trim().length > 0 && itemName.trim().length > 0 && !saving;
  }, [brand, itemName, saving]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);

    try {
      let image_path: string | null = null;

      // 1) 画像をStorageにアップ
      if (file) {
        const ext = file.name.split(".").pop() || "jpg";
        const filename = `${crypto.randomUUID()}.${ext}`;
        const path = `${date}/${filename}`;

        const { error: uploadError } = await supabase.storage
          .from("outfit-images")
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;
        image_path = path;
      }

      // 2) DBに保存
      const { error: insertError } = await supabase.from("outfits").insert({
        date,
        brand: brand.trim(),
        item_name: itemName.trim(),
        memo: memo.trim() ? memo.trim() : null,
        image_path,
      });

      if (insertError) throw insertError;

      setBrand("");
      setItemName("");
      setMemo("");
      setFile(null);
      setMessage("保存した ✅");
    } catch (err: any) {
      console.error(err);
      setMessage(`失敗: ${err?.message ?? String(err)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 520, margin: "0 auto" }}>
      <div style={{ display: "grid", gap: 12 }}>
        <label>
          日付
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
          />
        </label>

        <label>
          ブランド（必須）
          <input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="例: ZARA / UNIQLO C / soerte"
            style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
          />
        </label>

        <label>
          アイテム名（必須）
          <input
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="例: 黒レザージャケット"
            style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
          />
        </label>

        <label>
          メモ
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={4}
            placeholder="例: 仕事→経堂、黒セットアップで締め"
            style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
          />
        </label>

        <label>
          画像（任意）
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            style={{ display: "block", width: "100%", marginTop: 6 }}
          />
        </label>

        <button
          type="submit"
          disabled={!canSubmit}
          style={{ padding: "10px 14px", cursor: canSubmit ? "pointer" : "not-allowed" }}
        >
          {saving ? "保存中…" : "保存"}
        </button>

        {message && <p>{message}</p>}
      </div>
    </form>
  );
}
