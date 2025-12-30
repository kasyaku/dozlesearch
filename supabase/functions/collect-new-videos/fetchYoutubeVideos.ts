import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function fetchYoutubeVideos(): Promise<any[]> {
  const apiKey = Deno.env.get("YOUTUBE_API_KEY")!;
  const channelId = "UCj4PjeVMnNTHIR5EeoNKPAw"; // ← ドズル社のチャンネルID

  const publishedAfter = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

 // Step 1: Get video IDs from search.list
  const searchRes = await fetch(
    `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet&order=date&type=video&publishedAfter=${publishedAfter}&maxResults=50`
  );
  const searchJson = await searchRes.json();

  const videoIds = searchJson.items
    ?.map((item: any) => item.id.videoId)
    .filter((id: string) => !!id);

  if (!videoIds || videoIds.length === 0) return [];

  // Step 2: Get full video details from videos.list
  const detailsRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&id=${videoIds.join(",")}&part=snippet,contentDetails`
  );
  const detailsJson = await detailsRes.json();

  return detailsJson.items ?? [];
}