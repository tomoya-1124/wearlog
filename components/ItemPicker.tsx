"use client";

import { useEffect, useMemo, useState } from "react";

export type PickedItem = { id: string; label: string };

type Candidate = {
  id: string;
  brand_name: string;
  item_name: string;
  category: string | null;
};

export default function ItemPicker({
  picked,
  onChange,
}: {
  picked: PickedItem[];
  onChange: (v: PickedItem[]) => void;
}) {
  const [q, setQ] = useState("");
  const [cands, setCands] = useState<Candidate[]>([]);
  const [recent, setRecent] = useState<Candidate[]>([]);
  const [brand, setBrand] = useState("");
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("");
  const [busy, setBusy] = useState(false);

  const pickedIds = useMemo(() => new Set(picked.map((p) => p.id)), [picked]);

  useEffect(() => {
    // 最近使ったアイテム（超簡易：直近itemsを取る）
    fetch("/api/items/search?q=")
      .then((r) => r.json())
      .then((d) => setRecent((d.items ?? []).slice(0, 8)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      const res = await fetch(`/api/items/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setCands(data.items ?? []);
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  function addCandidate(c: Candidate) {
    if (pickedIds.has(c.id)) return;
    onChange([...picked, { id: c.id, label: `${c.brand_name} / ${c.item_name}` }]);
  }

  function remove(id: string) {
    onChange(picked.filter((p) => p.id !== id));
  }

  async function createItem() {
    if (!brand.trim() || !itemName.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/items/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand: brand.trim(), name: itemName.trim(), category: category.trim() || null }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      addCandidate(data.item);
      setBrand("");
      setItemName("");
      setCategory("");
      setQ("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
      <h2 style={{ marginTop: 0 }}>着用アイテム</h2>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {picked.map((p) => (
          <button key={p.id} onClick={() => remove(p.id)} style={{ padding: "6px 10px", borderRadius: 999 }}>
            {p.label} ×
          </button>
        ))}
      </div>

      <div style={{ marginTop: 10 }}>
        <input
          placeholder="検索（例: COS / ZARA / 黒セットアップ）"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
        />
      </div>

      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 12, opacity: 0.7 }}>候補</div>
        <div style={{ display: "grid", gap: 6, marginTop: 6 }}>
          {(q ? cands : recent).map((c) => (
            <button
              key={c.id}
              onClick={() => addCandidate(c)}
              disabled={pickedIds.has(c.id)}
              style={{ textAlign: "left", padding: 10, borderRadius: 10, border: "1px solid #eee" }}
            >
              {c.brand_name} / {c.item_name}
              {c.category ? <span style={{ fontSize: 12, opacity: 0.6 }}>（{c.category}）</span> : null}
            </button>
          ))}
        </div>
      </div>

      <hr style={{ margin: "14px 0" }} />

      <div style={{ fontSize: 12, opacity: 0.7 }}>見つからない場合：新規登録</div>
      <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
        <input placeholder="ブランド（例: COS）" value={brand} onChange={(e) => setBrand(e.target.value)} />
        <input placeholder="アイテム名（例: 黒ロングコート）" value={itemName} onChange={(e) => setItemName(e.target.value)} />
        <input placeholder="カテゴリ任意（outer/tops/...）" value={category} onChange={(e) => setCategory(e.target.value)} />
        <button onClick={createItem} disabled={busy} style={{ padding: 10, borderRadius: 10 }}>
          {busy ? "作成中..." : "＋作成して追加"}
        </button>
      </div>
    </section>
  );
}
