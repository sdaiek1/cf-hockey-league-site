export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";

export default async function NewsPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let newsPosts = [];
  let newsError = null;

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from("news_posts")
      .select(`
        id,
        title,
        summary,
        created_at,
        game:game_id(
          id,
          game_date,
          home_team:home_team_id(name),
          away_team:away_team_id(name)
        )
      `)
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) {
      newsError = error.message;
    } else {
      newsPosts = data || [];
    }
  } else {
    newsError = "Missing Supabase environment variables.";
  }

  const card = {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 20,
    padding: 20
  };

  const subCard = {
    background: "#111827",
    border: "1px solid #1f2937",
    borderRadius: 16,
    padding: 18
  };

  return (
    <main style={{ maxWidth: 1220, margin: "0 auto", padding: 20 }}>
      <section style={card}>
        <h1 style={{ fontSize: 40, marginTop: 0, marginBottom: 10 }}>News</h1>
        <p style={{ color: "#94a3b8", marginTop: 0, marginBottom: 24 }}>
          League stories, AI-generated game recaps, and featured updates.
        </p>

        {newsError ? (
          <p style={{ color: "#fca5a5" }}>Could not load news: {newsError}</p>
        ) : newsPosts.length === 0 ? (
          <p style={{ color: "#cbd5e1" }}>No news posts yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {newsPosts.map((post) => (
              <div key={post.id} style={subCard}>
                <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.15 }}>
                  {post.title}
                </div>
                <div style={{ color: "#67e8f9", marginTop: 8 }}>
                  {new Date(post.created_at).toLocaleDateString()}
                </div>
                {post.game ? (
                  <div style={{ color: "#cbd5e1", marginTop: 8 }}>
                    {post.game.game_date} • {post.game.home_team?.name} vs{" "}
                    {post.game.away_team?.name}
                  </div>
                ) : null}
                <div
                  style={{
                    color: "#e2e8f0",
                    marginTop: 14,
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap"
                  }}
                >
                  {post.summary}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
