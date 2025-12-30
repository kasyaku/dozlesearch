// fill-duration.ts
import "https://deno.land/std@0.177.0/dotenv/load.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 環境変数から読み込み
const supabase = createClient(
  Deno.env.get("PUBLIC_SUPABASE_URL")!,
  Deno.env.get("SERVICE_ROLE_KEY")!
);
const apiKey = Deno.env.get("YOUTUBE_API_KEY")!;

console.log("🔍 Fetching videos missing duration...");

// 1. duration_seconds が null の動画を取得
const { data: videos, error } = await supabase
  .from("video")
  .select("id")
  .is("duration_seconds", null)
  .limit(500); // 必要に応じて調整

if (error) {
  console.error("❌ Failed to fetch videos:", error);
  Deno.exit(1);
}

if (!videos || videos.length === 0) {
  console.log("✅ No videos to update");
  Deno.exit(0);
}

// 2. 50件ずつに分割
const chunks = chunk(videos.map((v) => v.id), 50);
const updates: { id: string; duration_seconds: number }[] = [];

for (const ids of chunks) {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&id=${ids.join(",")}&part=contentDetails`
  );
  const json = await res.json();

  for (const item of json.items ?? []) {
    const duration = item.contentDetails?.duration;
    const seconds = parseISODurationToSeconds(duration);
    if (seconds !== null) {
      updates.push({ id: item.id, duration_seconds: seconds });
    }
  }
}

// 3. Supabase に一括更新
let successCount = 0;
for (const update of updates) {
  const { error: updateError } = await supabase
    .from("video")
    .update({ duration_seconds: update.duration_seconds })
    .eq("id", update.id);

  if (updateError) {
    console.error(`❌ Failed to update ${update.id}:`, updateError);
  } else {
    successCount++;
  }
}

console.log(`✅ Updated ${successCount} videos`);

// ユーティリティ関数：配列をチャンク分割
function chunk<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );
}

// ISO 8601 Duration → 秒に変換
function parseISODurationToSeconds(iso: string): number | null {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return null;
  const [, h, m, s] = match.map(Number);
  return (h || 0) * 3600 + (m || 0) * 60 + (s || 0);
}