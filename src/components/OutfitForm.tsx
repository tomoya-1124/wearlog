"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Category =
  | "アウター"
  | "トップス"
  | "ボトムス"
  | "靴"
  | "小物";

const CATEGORIES: Category[] = ["アウター", "トップス", "ボトムス", "靴", "小物"];

type ItemRow = {
  category: Category;
  brand: string;
  name: string;
};

export default function OutfitForm() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [memo, setMemo] = useState("");
  const [publicFlg, setPublicFlg] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  // 各カテゴリ1行ずつ初期表示（UX良い）
  const [items, setItems] = useState<ItemRow[]>(
    CATEGORIES.map((c) => ({ category: c, brand: "", name: "" }))
  );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    const hasAny = items.some(
      (x) => x.brand.trim().length > 0 || x.name.trim().length > 0
    );
    return hasAny && !saving;
  }, [items, saving]);

  function updateItem(index: number, patch: Partial<ItemRow>) {
    setItems((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addRow(category: Category) {
    setItems((prev) => [...prev, { category, brand: "", name: "" }]);
  }

  function removeRow(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadImageIfNeeded(): Promise<string | null> {
    if (!file) return null;

    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${crypto.randomUUID()}.${ext}`;
    const path = `${date}/${filename}`;

    const { error } = await supabase.storage
      .from("outfit-images")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (error) throw error;

    const { data } = supabase.storage.from("outfit-images").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);

    try {
      const image_url = await uploadImageIfNeeded();

      // 空行は落とす（brand/nameどっちか入ってれば採用）
      const cleaned = items
        .map((x) => ({
          category: x.category,
          brand: x.brand.trim(),
          name: x.name.trim(),
        }))
        .filter((x) => x.brand.length > 0 || x.name.length > 0);

      const { error } = await supabase.from("outfits").insert({
        date,
        memo: memo.trim() ? memo.trim() : null,
        public_flg: publicFlg,
        image_url,
        items_json: cleaned, // ★これが複数アイテム本体
      });

      if (error) throw error;

      setMemo("");
      setPublicFlg(false);
      setFile(null);
      setItems(CATEGORIES.map((c) => ({ category: c, brand: "", name: "" })));
      setMessage("保存した ✅");
    } catch (err: any) {
      console.error(err);
      setMessage(`失敗: ${err?.message ?? String(err)}`);
    } finally {
      setSaving(false);
    }
  }

  // 表示用：カテゴリ別にグループ化
  const grouped = CATEGORIES.map((cat) => ({
    cat,
    rows: items.map((row, idx) => ({ row, idx })).filter((x) => x.row.category === cat),
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card space-y-4">
        <label className="block">
          <div className="text-sm text-white/70 mb-1">日付</div>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>

        <label className="block">
          <div className="text-sm text-white/70 mb-1">画像（任意）</div>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={publicFlg} onChange={(e) => setPublicFlg(e.target.checked)} />
          <span className="text-sm text-white/70">公開する（共有URLで見せる）</span>
        </label>
      </div>

      {/* カテゴリ枠 */}
      <div className="space-y-4">
        {grouped.map(({ cat, rows }) => (
          <section key={cat} className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold">{cat}</h3>
              <button type="button" onClick={() => addRow(cat)} className="w-auto px-3 py-2">
                ＋追加
              </button>
            </div>

            <div className="space-y-2">
              {rows.map(({ row, idx }) => (
                <div key={idx} className="grid grid-cols-2 gap-2 items-center">
                  <input
                    value={row.brand}
                    placeholder="ブランド"
                    onChange={(e) => updateItem(idx, { brand: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <input
                      value={row.name}
                      placeholder="アイテム名"
                      onChange={(e) => updateItem(idx, { name: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      className="w-auto px-3 py-2"
                      title="削除"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="card space-y-3">
        <label className="block">
          <div className="text-sm text-white/70 mb-1">説明（メモ）</div>
          <textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="今日のひとこと" />
        </label>

        <button type="submit" disabled={!canSubmit}>
          {saving ? "保存中…" : "保存"}
        </button>

        {message && <div className="text-sm text-white/80">{message}</div>}
      </div>
    </form>
  );
}

