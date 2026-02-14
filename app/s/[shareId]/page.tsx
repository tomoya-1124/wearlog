import { supabase } from "@/lib/supabaseClient";

export default async function SharePage({ params }: { params: { shareId: string } }) {
  const shareId = params.shareId;

  const { data: outfit, error } = await supabase
    .from("outfits")
    .select("id, date, memo, tags, image_url, public_flg")
    .eq("share_id", shareId)
    .single();

  if (error || !outfit) return <main style={{ padding: 16 }}>Not found</main>;
  if (!outfit.public_flg) return <main style={{ padding: 16 }}>Private</main>;

  // アイテムも表示（join）
  const { data: items } = await supabase
    .from("outfit_items")
    .select("item_id, items(name, category, brands(name))")
    .eq("outfit_id", outfit.id);

  return (
    <main style={{ padding: 16, maxWidth: 520, margin: "0 auto" }}>
      <h1>{outfit.date}</h1>
      {outfit.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={outfit.image_url} alt="" style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: 12 }} />
      )}
      <p style={{ marginTop: 10 }}>{outfit.memo ?? ""}</p>

      <section style={{ marginTop: 12 }}>
        <h2>Items</h2>
        <ul>
          {items?.map((row: any) => (
            <li key={row.item_id}>
              {row.items?.brands?.name} / {row.items?.name}
              {row.items?.category ? ` (${row.items.category})` : ""}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
