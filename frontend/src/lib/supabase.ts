/**
 * Supabase browser client — singleton instance.
 *
 * Used for:
 *  - Community posts (direct DB reads/writes with RLS)
 *  - Realtime subscriptions (future: live alerts, live prices)
 *  - Auth (when you add farmer login)
 *
 * The backend FastAPI app uses its own server-side Supabase connection
 * (via SQLAlchemy + asyncpg) and NEVER uses this client.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local"
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// ── Typed helpers (add more as tables are created in Supabase) ────────────────

export type CommunityPost = {
  id: string;
  created_at: string;
  author_name: string;
  author_role: string;
  author_img?: string;
  content: string;
  likes: number;
  comments: number;
  post_type: "discussion" | "expert" | "success";
};

/** Fetch latest discussions, ordered by most recent first. */
export async function fetchCommunityPosts(
  type?: CommunityPost["post_type"],
  limit = 20
): Promise<CommunityPost[]> {
  let query = supabase
    .from("community_posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (type) {
    query = query.eq("post_type", type);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as CommunityPost[];
}

/** Increment the like count for a post (optimistic — no auth needed). */
export async function likePost(postId: string): Promise<void> {
  const { error } = await supabase.rpc("increment_likes", { post_id: postId });
  if (error) throw new Error(error.message);
}
