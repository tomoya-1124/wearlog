import { supabase } from "@/lib/supabaseClient";

type Props = { params: { shareId: string } };

export default async function SharePage({ params }: Props) {
  const shareId = params.shareId;

  const { data, error } = await supabase
    .from("outfits")
    .select("*")
    .eq("share_id", shareId)
    .eq("public_flg", true)
    .single();

  if (error) {
    return (
      <main style={{ padding: 24, color: "white" }}>
        <h1>Share Debug</h1>
        <pre>{JSON.stringify({ shareId, error }, null, 2)}</pre>
      </main>
    );
  }

  if (!data) {
    return (
      <main style={{ padding: 24, color: "white" }}>
        <h1>Share Debug</h1>
        <p>NO DATA</p>
        <p>shareId: {shareId}</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, color: "white" }}>
      <h1>OK</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </main>
  );
}
