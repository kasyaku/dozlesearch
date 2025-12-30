import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { VideoMetadata } from "./types.ts";

export async function insertNewVideos(videos: VideoMetadata[]): Promise<number> {
  if (videos.length === 0) return 0;

  const supabase = createClient(
    Deno.env.get("PUBLIC_SUPABASE_URL")!,
    Deno.env.get("SERVICE_ROLE_KEY")!
  );

  // 既存の video.id を取得
  const { data: existing, error: fetchError } = await supabase
    .from("video")
    .select("id")
    .in("id", videos.map((v) => v.id));

  if (fetchError) {
    console.error("❌ Failed to fetch existing videos:", fetchError);
    throw fetchError;
  }

  const existingIds = new Set((existing ?? []).map((v) => v.id));
  const toInsert = videos.filter((v) => !existingIds.has(v.id));

  if (toInsert.length === 0) return 0;

  const { error: insertError } = await supabase.from("video").insert(toInsert);
  if (insertError) {
    console.error("❌ Failed to insert new videos:", insertError);
    throw insertError;
  }

  return toInsert.length;
}