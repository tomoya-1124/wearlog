"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type OutfitRow = {
  id: string;
  created_at: string;
  date: string;
  brand: string;
  item_name: string;
  memo: string | null;
  image_path: string | null;
  share_id: string;
};

export default function Home() {
  const [rows, setRows] = useState<OutfitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);

    const { data, error } = await supabase
      .from("outfits")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      setErr(error.message);
      setRows([]);
    } else {
      setRows((data ?? []) as OutfitRow[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2rem" }}>
      <h1>Wearlog</h1>

      <div style={{ display: "flex", gap: 12, margin: "12px 0 24px" }}>
        <Link href="/new">新規投稿へ</Link>
        <button onClick={load} disabled={loading}>
          {loading ? "読込中..." : "更新"}
        </button>
      </div>

      {err && <p style={{ color: "crimson" }}>エラー: {err}</p>}
      {loading && <p>読込中...</p>}
      {!loading && rows.length === 0 && <p>まだ投稿がありません</p>}

      <ul style={{ listStyle: "none", padding: 0 }}>
	  {rows.map((r) => (
 	　　 <li key={r.id} style={{ marginBottom: 12 }}>
 		 <Link
       　　　　　 href={`/s/${r.share_id}`}
       　　　　　 style={{ textDecoration: "none", color: "inherit" }}
      　　　　　>
       　　　　　 <div
         　　　　　 style={{
           　　　　　 border: "1px solid #ddd",
           　　　　　 borderRadius: 8,
           　　　　　 padding: 12,
         　　　　　 }}
       　　　　　 >
         　　　　　 <div style={{ fontSize: 12, opacity: 0.7 }}>{r.date}</div>
        　　　　　  <div style={{ fontWeight: 700 }}>{r.brand} / {r.item_name}</div>
         　　　　　 {r.memo && <div style={{ marginTop: 6 }}>{r.memo}</div>}
         　　　　　 <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
           　　　　　 share_id: {r.share_id}
         　　　　　 </div>
      　　　　　  </div>
    　　　　　  </Link>
   　　　　　 </li>
 　　　　　 ))}
　　　　</ul>
    </main>
  );
}
